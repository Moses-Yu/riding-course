from __future__ import annotations

from urllib.parse import parse_qsl, urlparse, unquote
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class ParseError(Exception):
    pass


def parse_naver_route(raw: str) -> dict:
    logger.debug("parse_naver_route: raw=%r", raw[:500])
    trim = raw.strip()
    import re
    # Extract first URL-like token to be robust against prefixes like '@' or surrounding text
    m_url = re.search(r"(nmap://[^\s]+|intent://[^\s]+|https?://[^\s]+)", trim, re.IGNORECASE)
    if m_url:
        trim = m_url.group(1)
    else:
        # handle bare host tokens like naver.me/xxxx or map.naver.com/...
        m_host = re.search(r"\b((?:naver\.me|map\.naver\.com)/[^\s]+)", trim, re.IGNORECASE)
        if m_host:
            trim = "https://" + m_host.group(1)

    # 1) nmap://route/{modality}?{qs}
    m = re.match(r"^nmap://route/([a-z]+)\?(.+)$", trim, re.IGNORECASE)
    if m:
        return _parse_query(m.group(1), m.group(2), 'nmap', raw)

    # 2) intent://route/{modality}?{qs}#Intent
    m = re.match(r"^intent://route/([a-z]+)\?(.+?)#Intent", trim, re.IGNORECASE)
    if m:
        return _parse_query(m.group(1), m.group(2), 'intent', raw)

    # 3) map.naver.com web best effort with coordinate extraction (v5 and p variants)
    if re.match(r"^https?://map\.naver\.com/(v5|p)/directions/", trim, re.IGNORECASE):
        return _parse_web_directions(trim, raw)

    # 4) naver.me shortlink: try to resolve to full directions URL, fallback to best-effort
    if re.match(r"^https?://naver\.me/", trim, re.IGNORECASE):
        try:
            import httpx
            logger.debug("Resolving shortlink: %s", trim)
            with httpx.Client(follow_redirects=True, timeout=3.0) as client:
                resp = client.get(trim)
                expanded = str(resp.url)
                logger.debug("Shortlink expanded to: %s", expanded)
                # re-run minimal checks against expanded
                if re.match(r"^https?://map\.naver\.com/(v5|p)/directions/", expanded, re.IGNORECASE):
                    parsed = _parse_web_directions(expanded, raw)
                    parsed['openUrl'] = raw  # preserve short link
                    parsed['meta']['raw'] = raw
                    parsed['meta']['expandedUrl'] = expanded
                    return parsed
        except Exception:
            logger.exception("Shortlink resolve failed: %s", trim)
            pass
        # fallback
        logger.info("Shortlink fallback for: %s", trim)
        return {
            'modality': 'car',
            'waypoints': [],
            'dest': None,
            'openUrl': trim,
            'meta': {'source': 'web-short', 'raw': raw},
            'nmapUrl': None,
        }

    # 5) Any other Naver web URL: accept best-effort to avoid 400s for variants
    try:
        parsed = urlparse(trim)
        host = (parsed.netloc or '').lower()
        if host.endswith('naver.com') or host.endswith('naver.me') or 'naver.' in host:
            return {
                'modality': 'car',
                'waypoints': [],
                'dest': None,
                'openUrl': trim,
                'meta': {'source': 'web', 'raw': raw},
                'nmapUrl': None,
            }
    except Exception:
        pass

    logger.warning("Unrecognized Naver link: %r", raw)
    raise ParseError('네이버 지도 공유 링크를 인식하지 못했어요.')


def _parse_query(modality: str, qs: str, source: str, raw: str) -> dict:
    # replace + to %20 before parsing
    from urllib.parse import urlencode
    params = dict(parse_qsl(qs.replace('+', '%20'), keep_blank_values=True))

    waypoints: list[dict] = []
    for i in range(1, 6):
        lat = params.get(f'v{i}lat')
        lng = params.get(f'v{i}lng')
        if lat and lng:
            waypoints.append({'lat': float(lat), 'lng': float(lng), 'name': params.get(f'v{i}name') or None})

    dest_lat = params.get('dlat')
    dest_lng = params.get('dlng')
    if not dest_lat or not dest_lng:
        logger.warning("Missing destination coordinates in query: %s", qs)
        raise ParseError('도착지 좌표가 없어요.')

    # rebuild canonical nmap url
    nmap_params: list[tuple[str, str]] = []
    if params.get('slat') and params.get('slng'):
        nmap_params.append(('slat', str(float(params['slat']))))
        nmap_params.append(('slng', str(float(params['slng']))))
        if params.get('sname'):
            nmap_params.append(('sname', params['sname']))
    nmap_params.append(('dlat', str(float(dest_lat))))
    nmap_params.append(('dlng', str(float(dest_lng))))
    if params.get('dname'):
        nmap_params.append(('dname', params['dname']))
    for index, w in enumerate(waypoints, start=1):
        nmap_params.append((f'v{index}lat', str(w['lat'])))
        nmap_params.append((f'v{index}lng', str(w['lng'])))
        if w.get('name'):
            nmap_params.append((f'v{index}name', w['name']))
    nmap_params.append(('appname', 'com.ridingcourse.app'))

    query = '&'.join([f"{k}={_percent_encode(v)}" for k, v in nmap_params])

    result = {
        'modality': modality or 'car',
        'start': None,
        'waypoints': waypoints,
        'dest': {'lat': float(dest_lat), 'lng': float(dest_lng), 'name': params.get('dname') or None},
        'openUrl': raw,
        'nmapUrl': f"nmap://route/{modality}?{query}",
        'meta': {'source': source, 'raw': raw},
    }
    if params.get('slat') and params.get('slng'):
        result['start'] = {'lat': float(params['slat']), 'lng': float(params['slng']), 'name': params.get('sname') or None}
    logger.debug("_parse_query: source=%s modality=%s dest=(%s,%s) waypoints=%d",
                 source, modality, dest_lat, dest_lng, len(waypoints))
    return result


def _percent_encode(value: str) -> str:
    from urllib.parse import quote
    return quote(str(value), safe='')


def _mercator_to_wgs84(x_m: float, y_m: float) -> tuple[float, float]:
    import math
    R = 6378137.0
    lon = (x_m / R) * (180.0 / math.pi)
    lat = (2.0 * math.atan(math.exp(y_m / R)) - (math.pi / 2.0)) * (180.0 / math.pi)
    return lon, lat


def _parse_web_directions(url: str, raw: str) -> dict:
    import re
    pr = urlparse(url)
    path = pr.path or ''
    m = re.search(r"/(v5|p)/directions/(.+)", path)
    places: list[dict] = []
    modality = 'car'
    variant = None
    if m:
        variant = m.group(1)
        segments_and_mode = m.group(2)
        # remove trailing mode like 'car' or 'car?c=...'
        parts = segments_and_mode.split('/')
        if parts:
            last = parts[-1]
            if last.startswith('car') or last.startswith('walk') or last.startswith('bike'):
                modality = 'car' if last.startswith('car') else ('walk' if last.startswith('walk') else 'bike')
                parts = parts[:-1]
        for seg in parts:
            # each seg: x,y,name,id,TYPE
            try:
                fields = seg.split(',')
                if len(fields) >= 3:
                    x = float(fields[0])
                    y = float(fields[1])
                    name = unquote(fields[2])
                    lon, lat = _mercator_to_wgs84(x, y)
                    places.append({'lat': lat, 'lng': lon, 'name': name})
            except Exception:
                continue

    start = None
    dest = None
    waypoints: list[dict] = []
    if len(places) >= 2:
        start = places[0]
        if variant == 'p' and len(places) >= 3:
            # For /p/directions, observed order: start, dest, waypoint1, waypoint2, ...
            dest = places[1]
            waypoints = places[2:]
        else:
            # Default (/v5/directions): start, waypoint..., dest
            dest = places[-1]
            if len(places) > 2:
                waypoints = places[1:-1]

    result = {
        'modality': modality,
        'start': start,
        'waypoints': waypoints,
        'dest': dest,
        'openUrl': url,
        'meta': {'source': 'web', 'raw': raw},
        'nmapUrl': None,
    }
    logger.debug("_parse_web_directions: modality=%s places=%d start=%s dest=%s",
                 modality, len(places), bool(start), bool(dest))
    return result


from __future__ import annotations

from urllib.parse import parse_qsl
from pydantic import BaseModel


class ParseError(Exception):
    pass


def parse_naver_route(raw: str) -> dict:
    trim = raw.strip()

    # 1) nmap://route/{modality}?{qs}
    import re
    m = re.match(r"^nmap://route/([a-z]+)\?(.+)$", trim, re.IGNORECASE)
    if m:
        return _parse_query(m.group(1), m.group(2), 'nmap', raw)

    # 2) intent://route/{modality}?{qs}#Intent
    m = re.match(r"^intent://route/([a-z]+)\?(.+?)#Intent", trim, re.IGNORECASE)
    if m:
        return _parse_query(m.group(1), m.group(2), 'intent', raw)

    # 3) map.naver.com v5 best effort
    if re.match(r"^https?://map\.naver\.com/v5/directions/", trim, re.IGNORECASE):
        return {
            'modality': 'car',
            'waypoints': [],
            'dest': None,
            'openUrl': trim,
            'meta': {'source': 'web', 'raw': raw},
            'nmapUrl': None,
        }

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
    return result


def _percent_encode(value: str) -> str:
    from urllib.parse import quote
    return quote(str(value), safe='')


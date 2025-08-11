from app.services.parser import parse_naver_route, ParseError


def test_nmap_parse_success():
    raw = "nmap://route/car?slat=37.1&slng=127.1&sname=Start&dlat=37.2&dlng=127.2&dname=End&v1lat=37.15&v1lng=127.15&appname=foo"
    r = parse_naver_route(raw)
    assert r['modality'] == 'car'
    assert r['start'] and r['start']['lat'] == 37.1
    assert r['dest']['lng'] == 127.2
    assert r['waypoints'] and len(r['waypoints']) == 1
    assert r['nmapUrl'].startswith('nmap://route/car?')


def test_intent_parse_success():
    raw = "intent://route/walk?dlat=37.2&dlng=127.2#Intent;scheme=nmap;package=com.nhn.android.nmap;end"
    r = parse_naver_route(raw)
    assert r['modality'] == 'walk'
    assert r['dest']['lat'] == 37.2
    assert r['meta']['source'] == 'intent'


def test_web_best_effort():
    raw = "https://map.naver.com/v5/directions/14142058.54,4518168.75,Start,11507535.00,4518123.00,End"
    r = parse_naver_route(raw)
    assert r['meta']['source'] == 'web'
    assert r['nmapUrl'] is None
    assert r['dest'] is None


def test_missing_dest_error():
    raw = "nmap://route/car?slat=37.1&slng=127.1&appname=foo"
    try:
        parse_naver_route(raw)
        assert False, "expected ParseError"
    except ParseError:
        pass


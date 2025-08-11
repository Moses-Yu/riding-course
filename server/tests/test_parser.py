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


def test_web_p_best_effort():
    raw = "https://map.naver.com/p/directions/14156584.2247297,4502987.1950958,%EC%97%AC%EC%A7%84%EB%B9%8C%EB%9D%BC,19221459,PLACE_POI/14158056.9815929,4505955.7856538,%EC%82%B0%EC%84%B1%EB%A1%9C%ED%84%B0%EB%A6%AC,1988104171,PLACE_POI/14161159.0995789,4499670.8705344,%EB%AA%A9%ED%98%845%EB%8F%99%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EA%B3%B5%EA%B0%84,1915773188,PLACE_POI/car?c=13.00,0,0,0,dh"
    r = parse_naver_route(raw)
    assert r['meta']['source'] == 'web'
    assert r['nmapUrl'] is None


def test_naver_me_shortlink_best_effort():
    raw = "https://naver.me/x7jr3Z9m"
    r = parse_naver_route(raw)
    assert r['meta']['source'] in ('web', 'web-short')
    assert r['openUrl'] == raw


def test_missing_dest_error():
    raw = "nmap://route/car?slat=37.1&slng=127.1&appname=foo"
    try:
        parse_naver_route(raw)
        assert False, "expected ParseError"
    except ParseError:
        pass


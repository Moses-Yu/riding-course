(React Native+Web/Expo, Tailwind는 NativeWind, 백엔드 FastAPI(or Nest)+MySQL, EC2 배포 가정)

파일 구조
client/ # 프론트엔드 앱
server/ # fastapi server

⸻

1) 전제 & 레퍼런스(핵심만)
	•	네이버 지도 앱 URL 스킴은 nmap://, 모든 URL에 appname 필수, 웹에선 intent://...#Intent;scheme=nmap;... 패턴 권장. 경유지는 최대 5개(자동차/도보/자전거).  ￼ ￼ ￼
	•	앱 미설치 시 마켓으로 유도하는 코드/패턴 예시가 문서에 있음.  ￼

⸻

1) 사용자 흐름 (MVP)
	1.	사용자가 네이버 지도 앱에서 길찾기 생성 → 공유 > 링크 복사(클립보드)
	2.	앱에서 “경로 붙여넣기” 버튼 → 클립보드 문자열 파싱
	3.	서버에 원본 문자열 + 파싱 결과 저장(제목/지역/태그/평가 항목은 폼에서 입력)
	4.	상세 화면에 요약 정보만 표시 + [네이버 지도에서 보기](붙여넣기 원본으로 딥링크 실행)
	5.	댓글/사진 리뷰/좋아요/북마크 등 커뮤니티 기능

지원할 입력 포맷(붙여넣기 원본)
	•	nmap://route/car?...&slat=..&slng=..&dlat=..&dlng=..&v1lat=..&v1lng=..&appname=... (권장/완벽)  ￼
	•	intent://route/car?...#Intent;scheme=nmap;... (안드 웹 공유)  ￼
	•	https://map.naver.com/v5/directions/... 형태(웹 공유 링크; 내부 파라미터가 좌표/장소ID일 수 있음 → 좌표 추출 실패 시에도 ‘원본 열기’는 가능)

⸻

2) 파서(Clipboard → RouteNormalized) 설계

목표: 최대한 많이 인식하되, 실패해도 “원본 열기”는 보장.
	•	입력 문자열 식별
	•	^nmap://route/([a-z]+)\?(.+)$ → QueryString 파싱
	•	^intent://route/([a-z]+)\?(.+)#Intent; → QueryString 파싱
	•	^https://map\.naver\.com/v5/directions/ → 세그먼트/쿼리 파싱(좌표가 WebMercator 혹은 장소ID인 케이스 존재 → 좌표 추출은 best-effort)
	•	필드 추출
	•	출발지: slat, slng, sname
	•	도착지: dlat, dlng, dname
	•	경유지: v1lat/v1lng/...v5lat/v5lng (+ v1name 등)
	•	이동수단: /route/car|walk|bike (우선 car만)
	•	검증: 경유지 5개 초과 시 컷, 위경도 범위, 필수값(dlat/dlng)
	•	정규화 결과

type RouteNormalized = {
  modality: 'car'|'walk'|'bike';
  start?: {lat:number; lng:number; name?:string};
  waypoints: {lat:number; lng:number; name?:string}[]; // ≤ 5
  dest: {lat:number; lng:number; name?:string};
  openUrl: string;       // 원본 그대로 (nmap/intent/https)
  nmapUrl?: string;      // 가능하면 표준 nmap 재조합
  meta: { source: 'nmap'|'intent'|'web'; raw: string };
}


	•	표준 nmap 재조합 규칙
	•	가능하면 nmap://route/car?...&appname=com.yourapp로 재작성(경유지 v1~v5).  ￼
	•	불완전(장소ID만 있음)하면 openUrl만 사용.

⸻

3) 프런트 구조(RN+Web, 지도 미사용)
	•	Screens
	•	Home(리스트): 지역/태그/정렬
	•	RouteCreate: 붙여넣기 필드 + 파싱 미리보기(텍스트) + 평가/태그/사진 업로드
	•	RouteDetail: 요약(거리·시간은 사용자가 입력한 값 or 빈값), 평가/태그/사진/댓글 + [네이버 지도에서 보기]
	•	My: 내 오토바이 선택, 내 활동
	•	컴포넌트
	•	PasteBox(클립보드 붙여넣기 + 자동검증/토스트)
	•	NaverOpenButton(설치 미확인 시 안내)
	•	딥링크 열기
	•	RN: Linking.openURL(nmapUrl || openUrl)
	•	웹: 안드로이드면 intent://...#Intent;scheme=nmap;...로 시도, 실패 시 설치 페이지로 유도. iOS는 앱스킴 시도 → 실패 시 App Store. (문서 패턴 참고)  ￼ ￼

⸻

4) 데이터 모델(요지: 지도 데이터 최소화 버전)
	•	routes: id, author_id, title, summary, region1, region2, length_km, duration_min, stars_scenery, stars_difficulty, surface(enum), traffic(enum), speedbump(enum), enforcement(enum), signal(enum), tags_bitmask, open_url(text), nmap_url(text), like_count, comment_count, created_at
	•	route_points: (선택) 파싱에 성공한 좌표만 저장(id, route_id, seq, lat, lng, name, type) — 좌표가 없어도 기능 동작엔 지장 없음
	•	나머지는 기존과 동일(photos, comments, bookmarks, tags …)

⸻

5) API (발췌)
	•	POST /routes/parse  ← 클라이언트가 붙여넣은 raw 문자열 전달 → RouteNormalized 응답
	•	POST /routes        ← 제목/요약/평가/태그 + open_url/nmap_url + (선택) points 저장
	•	GET /routes?region1=...&tag=...&sort=popular
	•	GET /routes/:id     ← 상세(요약·평가·태그·댓글·사진 + open_url/nmap_url)
	•	POST /routes/:id/open-track ← “열기” 클릭 로그(전환율 계산용)

⸻

6) UX 디테일 (지도 없는 버전)
	•	RouteCreate
	•	“1) 네이버 지도에서 길찾기 생성 → 2) 공유 > 링크 복사 → 3) 아래에 붙여넣기” 안내 스텝
	•	붙여넣기 즉시 파싱해서 출발/경유/도착을 텍스트 목록으로 미리보기(좌표 있으면 좌표, 없으면 이름만)
	•	경유지 5개 초과 시: “네이버 지도는 경유지 5개까지 지원합니다” 경고(자동 컷)  ￼
	•	RouteDetail
	•	상단에 코스 요약 카드(지역/길이/예상시간/평가 요약)
	•	하단 고정 CTA: [네이버 지도에서 보기](문서 가이드대로 설치 여부/인앱브라우저 예외 처리)  ￼
	•	접근성/반응형
	•	붙여넣기 영역은 큰 입력창 + 탭 타깃 ≥44px
	•	실패 시 에러 복구 문구: “원본 링크로는 열 수 있어요. 좌표 추출만 실패했습니다.”

⸻

7) 평가/정렬/태그 (요구 반영)
	•	평가 항목 그대로(후면 단속/방지턱/노면/차량/경치★/난이도★/길이/신호)
	•	정렬: 인기(좋아요+댓글 가중), 댓글순, 최신순, 열기 클릭수 순(전환)
	•	태그: 와인딩/고속/저속/힐링/경치/공기 좋음/바닷길/산길/강변/야경/카페투어/초보추천/장거리/단거리/한적함/노면양호/촬영포인트…(20개 내외)

⸻

8) “붙여넣기 파서” 프런트 예시 (TypeScript, RN/웹 공용)

export function parseNaverRoute(raw: string) {
  const trim = raw.trim();

  // 1) nmap://
  let m = trim.match(/^nmap:\/\/route\/([a-z]+)\?(.+)$/i);
  if (m) return parseQuery(m[1], m[2], 'nmap', raw);

  // 2) intent://
  m = trim.match(/^intent:\/\/route\/([a-z]+)\?(.+?)#Intent/i);
  if (m) return parseQuery(m[1], m[2], 'intent', raw);

  // 3) map.naver.com v5 (best-effort)
  if (/^https?:\/\/map\.naver\.com\/v5\/directions\//i.test(trim)) {
    return { modality: 'car', waypoints: [], dest: undefined as any,
      openUrl: trim, meta: { source: 'web', raw }, nmapUrl: undefined };
  }

  throw new Error('네이버 지도 공유 링크를 인식하지 못했어요.');
}

function parseQuery(modality: string, qs: string, source:'nmap'|'intent', raw:string) {
  const p = new URLSearchParams(qs.replace(/\+/g, '%20'));
  const wp = [];
  for (let i=1;i<=5;i++) {
    const lat = p.get(`v${i}lat`), lng = p.get(`v${i}lng`);
    if (lat && lng) wp.push({ lat:+lat, lng:+lng, name: p.get(`v${i}name`)||undefined });
  }
  const destLat = p.get('dlat'), destLng = p.get('dlng');
  if (!destLat || !destLng) throw new Error('도착지 좌표가 없어요.');

  const nmap = new URLSearchParams();
  if (p.get('slat') && p.get('slng')) {
    nmap.set('slat', String(+p.get('slat')!));
    nmap.set('slng', String(+p.get('slng')!));
    if (p.get('sname')) nmap.set('sname', p.get('sname')!);
  }
  nmap.set('dlat', String(+destLat));
  nmap.set('dlng', String(+destLng));
  if (p.get('dname')) nmap.set('dname', p.get('dname')!);
  wp.forEach((w,i)=>{ nmap.set(`v${i+1}lat`, String(w.lat)); nmap.set(`v${i+1}lng`, String(w.lng));
                      if (w.name) nmap.set(`v${i+1}name`, w.name); });
  nmap.set('appname', 'com.yourapp'); // 실제 앱/웹 식별자
  return {
    modality: (modality as any) || 'car',
    start: p.get('slat')&&p.get('slng') ? {lat:+p.get('slat')!, lng:+p.get('slng')!, name:p.get('sname')||undefined}:undefined,
    waypoints: wp,
    dest: { lat:+destLat, lng:+destLng, name:p.get('dname')||undefined },
    openUrl: raw,
    nmapUrl: `nmap://route/${modality}?${nmap.toString()}`,
    meta: { source, raw }
  };
}


⸻

9) 백엔드 처리
	•	POST /routes/parse: 서버에서도 동일 파서로 방어적 검증 (신뢰 경계)
	•	POST /routes: open_url 필수, nmap_url는 있으면 저장. 파싱된 좌표는 있으면 route_points에 저장(선택).
	•	리스트는 지도 의존 없이 지역/태그/정렬만으로 충분.

⸻

10) QA 체크리스트(붙여넣기 방식 특화)
	•	경유지 5개 제한 준수/에러 메시지.  ￼
	•	appname 누락 금지(재조합 시 반드시 추가).  ￼
	•	인앱브라우저(카톡/밴드)에서 nmap:// 차단될 수 있어 intent://...#Intent;scheme=nmap;... 폴백 및 마켓 이동 처리.  ￼
	•	좌표 추출 실패해도 원본 링크로 열기는 항상 보장.
	•	iOS LSApplicationQueriesSchemes에 nmap 등록 필요(앱에서 열기 확인).  ￼

⸻

11) 배포/인프라(EC2 + MySQL)
	•	EC2: Nginx(리버스 프록시) + API(Uvicorn/Nest) + 정적 웹 배포.
	•	MySQL: 오토 백업 스냅샷 + 주간 PITR 스크립트.
	•	이미지: S3+CloudFront(+ 사전서명 업로드).
	•	관측: Sentry + 요청/전환(“네이버 지도에서 보기” 클릭) 지표.

⸻

12) “추가되면 좋은 것들” (붙여넣기 전략에 잘 맞는 것만)
	•	클립보드 자동 감지: 화면 진입 시 URL 감지 → 상단 스낵바로 “붙여넣기 하시겠어요?”
	•	원클릭 제목 생성: 출발지→도착지 날짜/시간 자동 제목 제안
	•	웹 공유 프리뷰: OG 이미지(태그/평가 요약) 생성
	•	GPX 업로드(원하는 경우): 붙여넣기와 병행 지원
	•	품질 신뢰도 점수: 열기 클릭률, 신고율, 리뷰 평점 혼합
	•	오토바이 모델 프리셋: “네이키드/투어러/스포츠/스쿠터” + 브랜드/모델 마스터 제공
	•	그룹 라이딩 포스트: 코스에 “집결 시각/장소” 메타만 추가(지도 불필요)
	•	안전 고지: 과속·위험 유도 금지, 책임 한계, 사진 EXIF 위치 자동 제거

⸻

13) 비슷한 서비스 참고(전략 비교)
	•	Calimoto / REVER / Kurviger: 모두 앱 내 지도·트래킹 중심. 우리는 지도 미표시 + 네이버 길안내로 오픈에 초점 → 한국 로컬 최적화/간결한 UX로 차별화.  ￼

⸻
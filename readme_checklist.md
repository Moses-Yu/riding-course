### README Implementation Checklist

- [x] Backend scaffold (FastAPI, async SQLAlchemy, Alembic, MySQL local)
- [x] Parser service
  - [x] nmap://route car|walk|bike + query parsing and normalization
  - [x] intent://route ...#Intent parsing
  - [x] map.naver.com v5/p/directions best-effort with start/waypoints/dest extraction
  - [x] naver.me short link resolve (keeps short link, stores expanded in meta)
  - [x] Robust URL extraction from pasted text (e.g., prefixed with '@')
- [x] API
  - [x] POST /routes/parse → RouteNormalized
  - [x] POST /routes (create route with open_url/nmap_url and optional points)
  - [x] GET /routes?region1=&tag=&sort=popular|comments|latest|opens
  - [x] GET /routes/:id
  - [x] POST /routes/:id/open-track
  - [x] POST /routes/:id/like, /unlike (auxiliary)
- [x] Data model
  - [x] routes, route_points
  - [x] route_open_events (opens sorting)
- [x] CORS and local dev setup (Homebrew MySQL)
- [x] Frontend scaffold (Expo RN+Web w/ expo-router)
  - [x] Home list with sort and region filter
  - [x] Create screen (PasteBox → parse preview → save)
  - [x] Detail screen with "네이버 지도에서 보기" + open-track
  - [x] Removed Tailwind/NativeWind to ensure web bundling stability
- [x] Tests
  - [x] Parser unit tests for nmap, intent, v5/p, naver.me

Planned (in progress)
- [ ] Create screen: ratings and tags per README (bitmask)
- [ ] Comment/photos/bookmarks endpoints and UI
- [ ] Web share preview (OG image)
- [ ] Sentry and metrics for open conversions
- [ ] Deployment notes (EC2 + Nginx + Uvicorn + MySQL backups)



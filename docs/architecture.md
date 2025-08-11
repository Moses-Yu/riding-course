## Architecture

### High-level
- Client: Expo (React Native + Web) using `expo-router`
- Server: FastAPI with SQLAlchemy 2.0, Alembic migrations, MySQL (asyncmy)
- Auth: HMAC-signed token in an HTTP-only cookie
- Storage: Local `uploads/` directory for route photos (mounted via FastAPI StaticFiles in dev)

### Repository structure
- `client/`: Expo app screens and components
- `server/`: FastAPI app, Alembic, models, routers, services, tests

### User flow
1. User creates a directions link in Naver Map and copies it
2. In the app, user pastes the link; the server parses and normalizes it
3. User adds title, optional summary/tags/ratings/photos, and saves the route
4. Other users can view route details, open in Naver Map, comment, like, and bookmark

### Important paths
- Client screens: `client/app/index.tsx`, `route-create.tsx`, `route-detail.tsx`, `route-edit.tsx`, `my.tsx`, `register.tsx`
- Backend routers: `server/app/routers/{routes,comments,bookmarks,auth,reports}.py`
- Data models: `server/app/db/models.py`
- Parser: `server/app/services/parser.py`
- App wiring: `server/app/main.py`, `server/app/core/config.py`

### Parser strategy (Naver Map)
Accepted inputs:
- `nmap://route/{modality}?...`
- `intent://route/{modality}?...#Intent;scheme=nmap;...`
- `https://map.naver.com/(v5|p)/directions/...` best-effort coordinate extraction
- `https://naver.me/...` shortlink expansion where possible

Normalization result aligns with `RouteNormalized` in `server/app/schemas.py`.



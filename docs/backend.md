## Backend and data model

### Configuration
`server/app/core/config.py`
- `app_name`: app title
- `api_prefix`: `/api`
- `database_url`: MySQL async DSN
- `cors_origins`: allowed origins (dev)

Auth-related env vars consumed by routers/auth and core/auth:
- `AUTH_SECRET`: HMAC signing key for tokens
- `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE`

### Database models (SQLAlchemy)
`server/app/db/models.py`
- `Route`: route metadata and counters (likes/comments)
- `RoutePoint`: sequenced points for start/waypoints/destination
- `Comment`, `CommentLike`: comments and likes on comments
- `Bookmark`: user bookmarks for routes
- `RouteOpenEvent`: open tracking for “open in Naver Map”
- `Like`: user likes on routes
- `RoutePhoto`: photo URLs for a route
- `User`: minimal user table (email, password_hash, display_name)
- `Report`: report records for routes/comments

Notes
- `tags_bitmask` encodes up to 64 boolean tags
- `Route.has_photos` convenience property for clients

### Pydantic schemas
`server/app/schemas.py`
- `Waypoint`, `RouteNormalized`, `RouteCreate`, `RouteUpdate`, `RouteOut`
- `CommentCreate`, `CommentOut`
- `RegisterIn`, `LoginIn`, `UserOut`
- `ReportCreate`

### Parser service
`server/app/services/parser.py`
- Accepts Naver Map share links (`nmap://`, `intent://`, web URLs, shortlinks)
- Produces normalized structure for modality, start/waypoints/dest, and canonical `nmap://` when possible
- Best-effort fallbacks ensure the original URL can still be opened even when coordinates can’t be extracted

### App initialization
`server/app/main.py`
- CORS configured from `settings.cors_origins`
- Routers mounted under `settings.api_prefix` (`/api`)
- Static mount for local `uploads/`

### Database sessions
`server/app/db/session.py`
- Async engine and session factory using `asyncmy`
- Dependency `get_db()` yields an `AsyncSession`



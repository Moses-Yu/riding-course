## API reference

Base URL: `/api`

Authentication
- Minimal cookie token set by `POST /auth/login`
- Send credentials with `fetch(..., { credentials: 'include' })` from browsers/Expo Web

### Routes
- POST `/routes/parse` → `RouteNormalized`
  - Body: `{ "raw": string }` (JSON or form)

- POST `/routes` → `RouteOut`
  - JSON body: `RouteCreate`

- POST `/routes/with-photos` → `RouteOut`
  - multipart/form-data fields:
    - `title` (required), `summary?`, `open_url` (required), `nmap_url?`, `stars_scenery?`, `stars_difficulty?`, `tags_bitmask?`
    - `points?`: JSON string of `Waypoint[]` (start, waypoints, dest order)
    - `photos`: one or more files

- GET `/routes?region1=&tag=&sort=popular|comments|latest|opens` → `RouteOut[]`

- GET `/routes/{id}` → `RouteOut`

- GET `/routes/{id}/photos` → `{ id, url, created_at? }[]`

- POST `/routes/{id}/open-track` → `{ ok: true }`
  - Body (optional): `{ userAgent?, referrer?, platform? }`

- POST `/routes/{id}/like` → `RouteOut` (auth)
- POST `/routes/{id}/unlike` → `RouteOut` (auth)
- GET `/routes/{id}/liked` → `{ liked: boolean }` (auth)

- GET `/routes/mine` → `RouteOut[]` (auth)

- PATCH `/routes/{id}` → `RouteOut` (auth; only author)
  - JSON body: `RouteUpdate`

### Comments
- GET `/comments/route/{routeId}?sort=recent|likes` → `CommentOut[]`
- POST `/comments/route/{routeId}` → `CommentOut` (auth)
- GET `/comments/{commentId}/liked` → `{ liked: boolean }` (auth)
- POST `/comments/{commentId}/like` → `{ ok: true }` (auth)
- POST `/comments/{commentId}/unlike` → `{ ok: true }` (auth)

### Bookmarks
- POST `/bookmarks/route/{routeId}` → `{ ok: true }` (auth)
- DELETE `/bookmarks/route/{routeId}` → `{ ok: true }` (auth)
- GET `/bookmarks/` → `RouteOut[]` (auth)
- GET `/bookmarks/route/{routeId}` → `{ bookmarked: boolean }` (auth)

### Auth
- POST `/auth/register` → `UserOut`
  - `{ email, password, display_name? }`
- POST `/auth/login` → `{ ok: true }` (sets httpOnly cookie)
- POST `/auth/logout` → `{ ok: true }` (clears cookie)
- GET `/auth/me` → `UserOut` (auth)

### Reports
- POST `/reports/route/{routeId}` → `{ ok: true }`
  - `{ reason: string, detail?: string }`
- POST `/reports/comment/{commentId}` → `{ ok: true }`
  - `{ reason: string, detail?: string }`

### Data contracts (selected)
- `RouteCreate`
```
{
  "title": "string",
  "summary": "string?",
  "region1": "string?",
  "region2": "string?",
  "length_km": number?,
  "duration_min": number?,
  "stars_scenery": number?,
  "stars_difficulty": number?,
  "surface": "string?",
  "traffic": "string?",
  "speedbump": number?,
  "enforcement": number?,
  "signal": number?,
  "tags_bitmask": number?,
  "open_url": "string",
  "nmap_url": "string?",
  "points": [{ "lat": number, "lng": number, "name?": "string" }]?
}
```



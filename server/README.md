Local backend dev instructions

1) Create .env in server/

DATABASE_URL=mysql+asyncmy://root:password@127.0.0.1:3306/riding_course

2) Start MySQL locally (Docker)

docker run --name mysql-riding -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=riding_course -p 3306:3306 -d mysql:8.0

3) Install deps and run migrations

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

4) Run server

uvicorn app.main:app --reload --port 8080

APIs
- POST /api/routes/parse {raw:string body or form} → RouteNormalized
- POST /api/routes {...RouteCreate} → RouteOut
- GET /api/routes?region1=...&tag=...&sort=popular|comments|latest|opens → RouteOut[]
- GET /api/routes/:id → RouteOut
- POST /api/routes/:id/open-track {userAgent?,referrer?,platform?} → {ok}
 - POST /api/routes/:id/like, /unlike (auth required)

Auth (minimal cookie token)
- POST /api/auth/register {email,password,display_name?} → User
- POST /api/auth/login {email,password} → sets httpOnly cookie
- POST /api/auth/logout → clears cookie
- GET /api/auth/me → User (auth required)

Protected endpoints
- POST /api/comments/route/:id → create comment (auth)
- POST/DELETE /api/bookmarks/route/:id → add/remove bookmark (auth)
- GET /api/bookmarks/ → my bookmarked routes (auth)


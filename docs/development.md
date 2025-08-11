## Development setup

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Docker (for local MySQL) or a running MySQL 8 instance

### Backend (FastAPI)
Paths below assume project root at `/Users/moses/Side Project/riding-course`.

1) Create server/.env
```
DATABASE_URL=mysql+asyncmy://root:password@127.0.0.1:3306/riding_course
AUTH_SECRET=change-me
# Optional cookie flags for production-like dev
# AUTH_COOKIE_DOMAIN=localhost
# AUTH_COOKIE_SECURE=false
```

2) Start MySQL (Docker)
```
docker run --name mysql-riding -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=riding_course -p 3306:3306 -d mysql:8.0
```

3) Create venv, install deps, and run migrations
```
cd "/Users/moses/Side Project/riding-course/server"
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

4) Run the API server
```
uvicorn app.main:app --reload --port 8080
```

The API base URL in dev is `http://127.0.0.1:8080/api`.

### Client (Expo – React Native + Web)
1) Install dependencies
```
cd "/Users/moses/Side Project/riding-course/client"
npm install
```

2) Configure API base (optional)
- The client reads `EXPO_PUBLIC_API_BASE`. If not set, it defaults to `http://127.0.0.1:8080/api`.
- Example (Unix shell):
```
export EXPO_PUBLIC_API_BASE=http://127.0.0.1:8080/api
```

3) Start Expo
```
npm run dev
```

Open the app on web or a device/emulator. You can create a route by pasting a Naver Map share link.

### Running tests
```
cd "/Users/moses/Side Project/riding-course/server"
pytest -q
```



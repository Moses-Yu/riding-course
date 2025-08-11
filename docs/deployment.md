## Deployment

### Backend
- Provision MySQL 8 and set `DATABASE_URL`
- Set `AUTH_SECRET` (long random string)
- Optional: `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE=true` (when using HTTPS and a real domain)
- Apply Alembic migrations: `alembic upgrade head`
- Run with a production server (e.g., `uvicorn` behind Nginx)

Nginx (example)
```
location /api/ {
  proxy_pass http://127.0.0.1:8080/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
  alias /path/to/riding-course/server/uploads/;
  autoindex off;
}
```

### Client (web or native)
- Web: host via Expo web or a static host; point it at your API base via `EXPO_PUBLIC_API_BASE`
- Native: build with EAS or local builds; ensure deep link opening of `nmap://` works per platform constraints

### Assets/uploads
- In dev, the server mounts `uploads/` as static. For production, consider object storage (S3 + CloudFront) and signed uploads.



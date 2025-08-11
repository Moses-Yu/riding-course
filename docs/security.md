## Security notes

### Authentication
- Cookie name: `rc_token`
- Token: `userId:expires` HMAC-SHA256, base64url-encoded
- Env: `AUTH_SECRET` (HMAC key), `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE`
- Endpoints protected via `get_current_user` dependency

### CORS
- Origins are configured in `settings.cors_origins` (dev defaults provided). Adjust for production domains.

### Uploads
- Currently stored to local `uploads/` with basic filename sanitization. Prefer object storage in production; validate image types/size limits.

### Rate limiting and abuse
- Consider adding reverse-proxy rate limiting on auth and parse endpoints.

### Sensitive config
- Store secrets in environment variables or a secrets manager. Never commit real secrets.



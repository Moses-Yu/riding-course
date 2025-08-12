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

#### App Store and Play Store (Expo EAS)
1. Accounts
   - Apple Developer Program (99 USD/yr) and access to App Store Connect
   - Google Play Developer account (one-time 25 USD)

2. Project config (already added)
   - `client/app.json` contains: `ios.bundleIdentifier`, `android.package`, `version`, `ios.buildNumber`, `android.versionCode`
   - Optional but recommended: add `icon`, `splash`, and adaptive icon assets before release
   - iOS permissions text for photos/camera are set under `ios.infoPlist`

3. EAS setup
   - Install CLI: `npm i -g eas-cli` (or use `npx eas-cli`)
   - In `client/`, `eas login`
   - `eas whoami` to verify
   - `client/eas.json` defines `preview` and `production` build profiles

4. Environment
   - Set your API base for production. Option A: edit `client/eas.json` → `EXPO_PUBLIC_API_BASE`. Option B: `eas secret:create --scope project --name EXPO_PUBLIC_API_BASE --value https://yourdomain/api`

5. Build
   - iOS: `cd client && eas build -p ios --profile production`
   - Android: `cd client && eas build -p android --profile production`
   - Wait for builds to finish; download .ipa and .aab artifacts

6. Submit (optional automation)
   - iOS: `eas submit -p ios --latest --submit-auto`
   - Android: `eas submit -p android --latest --track production`
   - The first time, EAS will guide you to create/manage credentials (Apple) and keystore (Android). Prefer App Store Connect API Keys and Play Service Account JSON; save them as EAS secrets.

7. Store metadata
   - Prepare app name, description, keywords, screenshots (6.7"/5.5" iOS, and common Android sizes), privacy policy URL, support URL, category, age rating
   - Provide content declarations on Play (data safety) and iOS (privacy nutrition labels)

8. Deep linking to Naver Map
   - iOS: `LSApplicationQueriesSchemes` includes `nmap` (already configured)
   - Android: opening `nmap://` generally works via `Linking.openURL`. If you use `Linking.canOpenURL` on Android 11+, add a manifest `<queries>` entry via a config plugin to allow package visibility

9. Versioning for updates
   - Increment `ios.buildNumber` and `android.versionCode` for every store submission; bump `version` for user-visible releases

10. Review checklist
   - Real icon/splash, no Expo branding
   - Test deep links on device
   - Verify photo picker and camera permission prompts
   - Point to production API and test against a production backend

### Assets/uploads
- In dev, the server mounts `uploads/` as static. For production, consider object storage (S3 + CloudFront) and signed uploads.



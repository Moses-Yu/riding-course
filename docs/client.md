## Client (Expo) guide

### Tech
- Expo SDK 53, `expo-router`
- React 19, React Native 0.79

### Scripts
`client/package.json`
- `dev`: start Expo
- `android`, `ios`: build/run native projects
- `web`: run web target

### Screens
- `app/index.tsx`: Home list with region filter and sort modes
- `app/route-create.tsx`: Paste Naver link, preview parsed data, add ratings/tags/photos, save
- `app/route-detail.tsx`: Show details, likes/bookmarks, comments, photos, reports, open in Naver Map
- `app/route-edit.tsx`: Edit own route
- `app/my.tsx`: Login/logout, bookmarks, my routes
- `app/register.tsx`: Registration with optional motorcycle preference UI
- Layout/navigation: `app/_layout.tsx`

### Environment variable
- `EXPO_PUBLIC_API_BASE` (e.g., `http://127.0.0.1:8080/api`)
- Defaults to the local dev URL when not set

### Accessibility/UX notes
- Large tap targets and clear feedback
- Optimistic updates for likes/comments
- Web-friendly shadows and responsive layout



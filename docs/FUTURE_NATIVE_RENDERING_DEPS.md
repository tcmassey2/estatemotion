# Future Native and Rendering Dependencies

EstateMotion is currently configured for the static browser MVP on Vercel. The production deploy does not install Expo, React Native, Remotion, Stripe React Native, TypeScript, or backend rendering dependencies.

This is intentional so Vercel can deploy:

- `index.html`
- `app.js`
- `styles.css`
- `app/index.html`
- `demo/index.html`
- `api/env.js`
- `vercel.json`
- `supabase/schema.sql`
- `supabase/seed.sql`

Keep the existing `src/`, `remotion/`, and `backend/` code folders in the repo. Real MP4 rendering now lives in `render-worker/`, which is intentionally separate from the static Vercel app.

## Future Expo App Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^1.23.1",
  "@stripe/stripe-react-native": "^0.38.6",
  "@supabase/supabase-js": "^2.45.4",
  "expo": "~51.0.28",
  "expo-auth-session": "~5.5.2",
  "expo-file-system": "~17.0.1",
  "expo-image-picker": "~15.0.7",
  "expo-status-bar": "~1.12.1",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "react-native-safe-area-context": "4.10.5"
}
```

## Future Remotion Render Worker Dependencies

```json
{
  "@remotion/renderer": "^4.0.229",
  "remotion": "^4.0.229",
  "tsx": "^4.19.1",
  "typescript": "~5.3.3",
  "@types/react": "~18.2.79"
}
```

Use `render-worker/README.md` for the current Remotion worker setup. Do not add those dependencies to the root `package.json`; the root package must remain lightweight for static Vercel deployment.

# Franchise Service App

This is a Vite + React application that uses Supabase for authentication and backend access.

## Local Development

1. Copy `.env.example` to `.env`
2. Set the following variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEV_PASSWORD`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Render Deployment

The app is configured to deploy as a Render Static Site via `render.yaml`.

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

### Required environment variables

Set these in the Render dashboard for the service:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEV_PASSWORD`

If you want the app to be accessible in production, connect your GitHub repo and deploy the `main` branch.

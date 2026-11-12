# Deploy ReMember to Render

This repository is configured as a single Render **Web Service**: Render builds the React app, then the Express server serves both the API and the built frontend. The service uses the `main` branch.

## Before you deploy

1. Create a MongoDB Atlas database and copy its connection string (`mongodb+srv://...`). Configure Atlas Network Access to allow Render to connect (for a quick setup, Atlas allows `0.0.0.0/0`; use appropriate access controls for production).
2. Generate two different, strong secrets locally, for example:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run it twice, once for `JWT_SECRET` and once for `ENCRYPTION_KEY`. Keep these values private; do not commit them.

## Create the Render service

1. In Render, choose **New → Blueprint** and connect `varun-codify/ReMember`, or choose **New → Web Service** and connect the repository.
2. Select the `main` branch. If using a Blueprint, Render reads the root `render.yaml` and sets the build, start, and health-check commands for you.
3. Set these required environment variables in the Render service's **Environment** page:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — the first generated secret
   - `ENCRYPTION_KEY` — the second generated secret
   - `NODE_ENV` is already set to `production` by `render.yaml`.
4. Save the settings and deploy. The health endpoint is `/api/health`.

If creating a Web Service manually, use:

- **Root Directory:** leave blank (repository root)
- **Build Command:** `npm ci --prefix server && npm ci --prefix client && npm run build --prefix client`
- **Start Command:** `npm start --prefix server`
- **Health Check Path:** `/api/health`
- **Branch:** `main`

The frontend calls `/api` on the same origin, so a separate frontend service or `REACT_APP_API_URL` is not needed. Render's free web service may spin down after inactivity, so the first request after idle time can take longer.

## Optional integrations

Add only the variables for features you use, in Render's Environment page; never add secrets to Git:

- `AI_API_KEY` (optional; `AI_BASE_URL` and `AI_MODEL` have defaults)
- `YOUTUBE_API_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL` for email reminders
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` for push notifications

For email reminder links, set `APP_URL` to your deployed Render URL. The Express reminder scheduler runs in the web service when configured.

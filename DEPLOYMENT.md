# ReMember Deployment Guide

## Prerequisites

Before deploying, you need:

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at https://www.mongodb.com/cloud/atlas/register
   - Create a cluster and get the connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/remember?retryWrites=true&w=majority`

2. **Vercel Account**
   - Sign up at https://vercel.com/signup
   - Can use your GitHub account

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free M0 tier)
3. Create a database user:
   - Go to "Database Access"
   - Add New Database User
   - Set username and strong password
   - Grant "Read and Write" privileges
4. Configure Network Access:
   - Go to "Network Access"
   - Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for Vercel
5. Get Connection String:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `remember`

## Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 3: Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy the project:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `remember` (or your choice)
   - In which directory is your code located: `./`
   - Want to override settings: `N`

   `vercel.json` is already configured to (1) build the React app in
   `client/` via `@vercel/static-build` and (2) route all non-API traffic to
   the built `index.html`, so the frontend works after a fresh deploy with no
   extra steps.

4. **Set Environment Variables:**
   
   After initial deployment, configure these environment variables in Vercel Dashboard:
   
   Go to: https://vercel.com/your-username/remember/settings/environment-variables
   
   Add the following variables:
   
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Generate a secure random string (e.g., use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `ENCRYPTION_KEY` = Generate another secure random string
   - `NODE_ENV` = `production`
   - `YOUTUBE_API_KEY` = Your YouTube API key (optional, leave empty if you don't have one)

5. **Redeploy after setting env variables:**
   ```bash
   vercel --prod
   ```

> The frontend calls the API at the **same origin** (`/api`) by default, so no
> `REACT_APP_API_URL` is needed for a single-project Vercel deployment. Only
> set it if you host the frontend and API on different domains.

## Step 4: Test Your Deployment

1. Open the provided Vercel URL
2. Test user registration
3. Test login
4. Test creating passwords/tasks/videos/websites
5. Test all CRUD operations

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/remember` |
| `JWT_SECRET` | Secret key for JWT tokens | Random 64-character hex string |
| `ENCRYPTION_KEY` | Key for encrypting passwords | Random 64-character hex string |
| `NODE_ENV` | Environment mode | `production` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (optional) | Your API key or leave empty |

## Generating Secure Keys

Run these commands to generate secure keys:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

### API Endpoints Not Working
- Check Vercel function logs in the dashboard
- Verify all environment variables are set
- Check for any build errors

### Build Failures
- Ensure all dependencies are listed in package.json files
- Check for any console errors in Vercel build logs

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Remove deployment
vercel remove [deployment-name]
```

## Git Structure — Resolved

`client/` was previously a git link to a local-only CRA repository (no remote,
no `.gitmodules`), which would have made a fresh clone or CI deployment fail.
It has been converted to a **regular tracked directory** — a fresh clone now
contains the full frontend. The original client repo history is preserved at
`../client-repo-backup-7d85dc1.bundle` (outside this repo).

## Rate Limiting Note

The Express server rate-limits login/register (in-memory). The Vercel
serverless API does not ship a rate limiter — if you deploy the API to Vercel
for public use, enable **Vercel's native rate limiting** (Pro plan) or add a
Redis-backed limiter.

## Email Reminders (Optional)

The reminder scheduler emails users with due/overdue tasks via Resend. Set these
variables to enable it:

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key from https://resend.com/api-keys |
| `EMAIL_FROM` | Sender address (free plan: `ReMember <onboarding@resend.dev>`) |
| `APP_URL` | Public app URL used in reminder email links |
| `CRON_SECRET` | Bearer token protecting the serverless cron endpoint |

- **Express server**: the scheduler runs automatically every 6 hours (no-op
  until `RESEND_API_KEY` is set).
- **Vercel**: add a cron entry to `vercel.json` pointing at the cron function
  (Vercel Cron requires a supported plan):
  ```json
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 */6 * * *" }]
  ```
  The endpoint accepts `Authorization: Bearer <CRON_SECRET>`.

Without email configured, the in-app reminder center in the navbar still works.

## AI Quick Capture (Optional)

Natural-language capture ("remind me to call mom friday") and auto-tagging for
saved videos/links. Uses any OpenAI-compatible chat endpoint — Groq's free
tier is the default, so this can be enabled with a single key:

| Variable | Description |
|----------|-------------|
| `AI_API_KEY` | API key (Groq: https://console.groq.com/keys) — unset to disable |
| `AI_BASE_URL` | OpenAI-compatible base URL (default `https://api.groq.com/openai/v1`) |
| `AI_MODEL` | Model (default `llama-3.3-70b-versatile`; `llama-3.1-8b-instant` has higher free rate limits) |

When unset, the AI sections on the Capture page are hidden and all AI calls
are no-ops — the rest of the app works exactly as before.

## Browser Push Notifications (Optional)

Push reminders for due tasks use the Web Push API (VAPID keys):

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Generate both keys with `npx web-push generate-vapid-keys --json` |
| `VAPID_PRIVATE_KEY` | Same command — keep private |
| `VAPID_SUBJECT` | Contact for the push service: `mailto:` or `https:` (optional) |

The reminder scheduler sends pushes alongside email digests. Users opt in via
the reminder bell in the navbar (requires a supported browser; the service
worker is served from `/sw.js` in production builds).

## Security Hardening (Built In)

The app ships with layered defenses against the common "vibe-coded app"
vulnerabilities — no configuration needed:

| Threat | Defense |
|--------|---------|
| Brute force / abuse | Per-IP rate limits: login 20/15min, register 10/hr, AI 60/15min, global 1000/15min (Express). The serverless `api/` layer has the same rules per warm instance. |
| NoSQL injection | `$`/`.` keys are stripped from `body`/`query`/`params` on both layers before they can reach Mongoose filters. |
| Stored XSS | Saved URLs (websites, videos, password sites) must be `http(s)`; the client refuses to render `javascript:`/`data:` links. Emails HTML-escape user content. Strict CSP (`script-src 'self'`) on the client. |
| CSRF | Bearer-token auth (no cookies), plus origin validation — state-changing requests from unknown origins are rejected with 403. |
| Header leakage | `helmet` on Express, security headers + CSP in `vercel.json`. |

Operational notes:

- **`CLIENT_URL` is an allowlist** — it can be a comma-separated list. Any
  frontend origin that should be allowed to call the API must be listed there
  (the origin check also accepts same-origin requests, so the default
  Express-served setup needs no change).
- The serverless limiter is **per warm instance** — it stops single-instance
  bursts but is not a global quota. For hard guarantees at scale, enable
  Vercel's native rate limiting (Pro plan) or a Redis-backed limiter.
- The client CSP in `vercel.json` and the helmet CSP in `server/server.js` are
  mirrors — keep them in sync when editing either.
- `client/public/theme.js` is an external script so the CSP can stay strict
  (`script-src 'self'`, no `'unsafe-inline'`). Don't reintroduce inline
  `<script>` blocks in `index.html`.

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- GitHub Issues: Create an issue in your repository

# Deploying Code Raider to Railway

Estimated time: 20–30 minutes.

## 1. Get your Steam API key

Go to https://steamcommunity.com/dev/apikey
Register with any domain name for now (you'll update it to your Railway URL after deploy).
Copy the key.

## 2. Push the project to GitHub

```bash
git init
git add .
git commit -m "initial"
gh repo create code-raider --private --push
# or: git remote add origin https://github.com/YOU/code-raider && git push -u origin main
```

## 3. Create a Railway project

1. Go to https://railway.app and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `code-raider` repo
4. Railway will detect Node.js and use `railway.json` for build/start commands

## 4. Add Postgres

In your Railway project dashboard:
1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway auto-injects `DATABASE_URL` into your service — you don't need to copy it manually

## 5. Add Redis

1. Click **+ New** → **Database** → **Add Redis**
2. Railway auto-injects `REDIS_URL` — no manual copy needed

## 6. Set environment variables

In your Railway service → **Variables** tab, add:

| Key              | Value                                 |
|------------------|---------------------------------------|
| NODE_ENV         | production                            |
| SESSION_SECRET   | (generate: `openssl rand -hex 32`)    |
| STEAM_API_KEY    | (from step 1)                         |
| BASE_URL         | https://YOUR-APP.up.railway.app       |
| CLIENT_URL       | https://YOUR-APP.up.railway.app       |

`DATABASE_URL` and `REDIS_URL` are injected automatically by Railway — don't add them manually.

## 7. Get your Railway URL

After first deploy, Railway shows your URL in the **Settings** → **Domains** panel.
It looks like: `https://code-raider-production-xxxx.up.railway.app`

## 8. Update Steam API key returnURL

Go back to https://steamcommunity.com/dev/apikey and update the domain to your Railway URL.
Steam doesn't care about the path — just the domain is enough.

Also update `BASE_URL` and `CLIENT_URL` in Railway env vars to match the exact URL.

## 9. Redeploy

Railway auto-deploys on every push. If you just changed env vars, click **Redeploy** in the Railway dashboard.

## 10. Share with your clan tonight

Send your crew: `https://YOUR-APP.up.railway.app`

They sign in with Steam, one person creates a session and shares the RAID-XXXX code,
everyone joins and starts raiding.

---

## Cost

| Resource     | Free tier       | Paid (est.)     |
|-------------|-----------------|-----------------|
| Node service | 500 hrs/month   | ~$5/month       |
| Postgres     | 1 GB included   | ~$5/month       |
| Redis        | 25 MB included  | ~$3/month       |
| **Total**    | **Free to start** | **~$10-15/month** |

Free tier is fine for your clan testing tonight. The 500 hr/month cap is per service —
with 3 services you'll want to upgrade to Railway's $5/seat plan if you plan to keep it live.

---

## Local dev (two terminals)

```bash
# Terminal 1
docker compose up -d          # start Postgres + Redis
cd server && npm install
cp ../.env.example .env       # fill in STEAM_API_KEY, SESSION_SECRET
npm run dev                   # server on :3001

# Terminal 2
cd client && npm install
npm run dev                   # Vite on :5173, proxied to :3001
```

Open http://localhost:5173

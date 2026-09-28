# Code Raider

A coordination and tracking tool for Rust clans working through code-lock
combinations together. One person creates a raid session, teammates join with
a share code, and the server hands each member a **non-overlapping slice** of
the 0000–9999 keyspace (ordered by real-world PIN frequency). Everyone marks
codes tried/found by hand; when someone hits the code, the whole team sees
**DOOR OPEN** live.

It does **not** interact with the game in any way — no input automation, no
memory reads, nothing that touches the Rust client or EAC. It's a shared,
synced notepad: humans still type every code into the lock themselves.

> **Server rules are on you.** Some Rust servers treat organized keyspace
> splitting as an exploit of the code-lock mechanic even without automation,
> and others don't care. Make sure this is allowed where your group plays.

## Stack

| Layer     | Tech                                             |
|-----------|--------------------------------------------------|
| Client    | React 18, React Router, Vite, socket.io-client   |
| Server    | Node, Express, Socket.io, Passport (Steam OpenID)|
| Data      | Postgres (users, sessions, groups, found codes)  |
| Realtime  | Redis (per-session queue index, buffers, roster) |
| Deploy    | Railway (`railway.json`) or any Node host        |

## How it works

- **Auth** — Sign in with Steam (OpenID). Users are upserted into Postgres on
  each login (`server/routes/auth.js`).
- **Sessions** — `POST /api/sessions` mints a `RAID-XXXX` code and seeds Redis
  session meta. Teammates join over Socket.io (`server/sockets/session.js`).
- **Keyspace split** — A frequency-ordered queue of all 10,000 codes
  (`server/queue.js`) is claimed atomically per player via a Redis counter, so
  no two teammates ever get the same code. Each player buffers 2 codes ahead.
- **Live state** — Tried counts, roster/online status, and the winning code
  are broadcast to everyone in the session room in real time.
- **Groups & rankings** — Optional persistent clans (`/api/groups`) and a
  global "codes found" leaderboard (`/api/rankings`).

## Repository layout

```
client/                 Vite + React front-end
  src/
    pages/              Home, Lobby, Session, Rankings, Groups
    components/         CodeRaider (the dispenser UI)
    hooks/              useAuth, useSession (socket wiring)
server/                 Express + Socket.io API
  routes/               auth, sessions, rankings, groups
  sockets/session.js    realtime session handler
  db/schema.sql         idempotent Postgres schema (applied on boot)
  queue.js              frequency-ordered 4-digit code queue
docker-compose.yml      local Postgres + Redis
railway.json            Railway build/deploy config
DEPLOY.md               step-by-step Railway deployment
```

## Quick start (one command)

With [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
and a [Steam Web API key](https://steamcommunity.com/dev/apikey) in hand, from
the repo root on macOS / Linux / WSL / Git Bash:

```bash
./start.sh
```

It brings up Postgres + Redis, writes `server/.env` (prompting once for your
Steam key, auto-generating `SESSION_SECRET`), installs dependencies, and starts
both the API (:3001) and client (:5173). Open http://localhost:5173. Your key
and secret live only in `server/.env`, which is git-ignored — never committed.

## Local development (manual)

Two terminals, with Postgres + Redis from Docker.

```bash
# One-time: bring up Postgres + Redis
docker compose up -d

# Terminal 1 — server
cd server
npm install
cp ../.env.example .env      # fill in STEAM_API_KEY + SESSION_SECRET
npm run dev                  # http://localhost:3001

# Terminal 2 — client
cd client
npm install
npm run dev                  # http://localhost:5173 (proxies /api, /auth, /socket.io)
```

Open http://localhost:5173. You'll need a [Steam Web API key](https://steamcommunity.com/dev/apikey)
to sign in even locally, because auth goes through Steam OpenID.

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for a full Railway walkthrough (Postgres +
Redis add-ons, environment variables, Steam key setup). The production server
serves the built client from `client/dist` on the same origin.

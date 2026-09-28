#!/usr/bin/env bash
# Code Raider — one-command local startup (macOS / Linux / WSL / Git Bash).
# Brings up Postgres + Redis (Docker), writes server/.env, installs deps,
# and starts both the API (:3001) and the client (:5173).
#
# Usage:
#   ./start.sh                 # prompts for your Steam key the first time
#   STEAM_API_KEY=xxxx ./start.sh
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\033[36m▶ %s\033[0m\n' "$1"; }
die() { printf '\033[31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

# ── 1. Docker check ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
docker info >/dev/null 2>&1 || die "Docker is installed but not running. Start Docker Desktop and re-run."

# ── 2. Steam API key ─────────────────────────────────────────────────────────
KEY="${STEAM_API_KEY:-}"
if [ -f server/.env ]; then
  cur=$(grep -E '^STEAM_API_KEY=' server/.env | cut -d= -f2- || true)
  if [ -n "$cur" ] && [ "$cur" != "your-steam-api-key" ]; then KEY="$cur"; fi
fi
if [ -z "$KEY" ]; then
  printf 'Paste your Steam Web API key (https://steamcommunity.com/dev/apikey): '
  read -r KEY
  [ -n "$KEY" ] || die "No key entered."
fi

# ── 3. Postgres + Redis ──────────────────────────────────────────────────────
say "Starting Postgres + Redis (docker compose)…"
docker compose up -d
printf 'Waiting for Postgres'
until docker compose exec -T postgres pg_isready -U dev >/dev/null 2>&1; do printf '.'; sleep 1; done
printf ' ready\n'

# ── 4. server/.env (secrets stay local; never committed) ─────────────────────
[ -f server/.env ] || cp .env.example server/.env
SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
tmp=$(mktemp)
awk -v k="$KEY" -v s="$SECRET" '
  /^STEAM_API_KEY=/  { print "STEAM_API_KEY=" k; next }
  /^SESSION_SECRET=/ && $0 ~ /change-me/ { print "SESSION_SECRET=" s; next }
  { print }
' server/.env > "$tmp" && mv "$tmp" server/.env

# ── 5. Dependencies ──────────────────────────────────────────────────────────
say "Installing dependencies…"
(cd server && npm install --no-fund --no-audit)
(cd client && npm install --no-fund --no-audit)

# ── 6. Run both ──────────────────────────────────────────────────────────────
say "Launching API (:3001) and client (:5173). Ctrl-C to stop."
pids=()
(cd server && npm run dev) & pids+=($!)
(cd client && npm run dev) & pids+=($!)
trap 'kill "${pids[@]}" 2>/dev/null || true' INT TERM EXIT
sleep 2
printf '\n\033[32m✔ Open http://localhost:5173 and sign in with Steam.\033[0m\n\n'
wait

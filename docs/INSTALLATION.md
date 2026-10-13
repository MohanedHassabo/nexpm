# Installation and local development

## Requirements

- Ubuntu 22.04/24.04 or Windows 11 with WSL2 Ubuntu; keep repository on the Linux filesystem.
- Node.js >=22 (Node 24 used successfully), npm 10+; Git, OpenSSL.
- Docker Engine + Compose v2, or Docker Desktop with WSL2 integration.
- MongoDB 7, Redis 7 (development Compose supplies both); network ports 27017 and 6380 in the user's *existing* deployment.
- At least 4 GB RAM recommended for the development stack; more for heavy Vite builds. Disk capacity for npm, Docker images and volumes.
- Browser: recent Chrome, Edge or Firefox.

## Repository layout

```text
nexpm/
  apps/api/src/             Express/Mongoose service
  apps/web/src/             React UI and translations
  docs/                     Release and operational documentation
  .github/workflows/ci.yml  Build/test CI
  compose.dev.yml           Mongo + Redis development containers
  compose.prod.yml          Docker production topology (needs hardening)
  .env.example              Example variables; do not commit .env
  package.json              npm workspace commands
```

## WSL2 setup (first time)

```bash
node --version && npm --version
sudo apt update && sudo apt install -y git openssl unzip
cd ~/projects/nexpm-demo
npm install
```

**Existing NexPM installation:** The user's original Docker Compose project `nexpm` already has MongoDB at `127.0.0.1:27017` and Redis at `127.0.0.1:6380`. **Do not start another compose instance using overlapping host ports.** Stock `compose.dev.yml` maps Redis host port 6379, whereas the existing instance was locally customized to 6380. Preserve that override or use the existing containers.

## Environment setup

```bash
cp .env.example .env
nano .env
```

Set these **exactly once** (remove duplicate keys in the older example file):

```dotenv
NODE_ENV=development
PORT=4000
MONGO_URL=mongodb://127.0.0.1:27017/nexpm_demo_v096
REDIS_URL=redis://127.0.0.1:6380
JWT_SECRET=REPLACE_WITH_RANDOM_HEX
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
VITE_API_URL=/api
PUBLIC_WEB_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:4000
PLATFORM_ADMIN_EMAILS=admin@nexpm.app
APP_CONFIG_ENCRYPTION_KEY=REPLACE_WITH_RANDOM_HEX
EMAIL_DEV_LOG_LINK=true
```

Generate secrets **without printing them**:

```bash
jwt=$(openssl rand -hex 32); cfg=$(openssl rand -hex 32)
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$jwt|" .env
sed -i "s|^APP_CONFIG_ENCRYPTION_KEY=.*|APP_CONFIG_ENCRYPTION_KEY=$cfg|" .env
unset jwt cfg
chmod 600 .env
```

Never rotate `APP_CONFIG_ENCRYPTION_KEY` without a credential migration plan once provider credentials have been saved. Rotating JWT revokes prior sessions. Set `EMAIL_DEV_LOG_LINK=false` outside local development.

Check duplicated keys (should produce no output):

```bash
grep -vE '^[[:space:]]*(#|$)' .env | cut -d= -f1 | sort | uniq -d
```

## Infrastructure and application

```bash
# Confirm shared containers are running; do not duplicate them:
docker compose -p nexpm -f ~/projects/nexpm/compose.dev.yml ps
cd ~/projects/nexpm-demo
set -a; source .env; set +a
npm run lint
npm test
npm run build
npm run seed        # demo database only; intentionally creates public test credentials
npm run dev
```

Open `http://localhost:5173` and confirm `http://localhost:4000/api/health`. If Vite reports `Property 'env' does not exist on type 'ImportMeta'`, create `apps/web/src/vite-env.d.ts` with `/// <reference types="vite/client" />` and rerun TypeScript checks.

**Demo account:** The current seed has historically used `admin@nexpm.app` / `Demo@12345!`. Verify `apps/api/src/seed.ts`; do not assume credentials if the script was edited. Never seed a real production database.

## Additional commands

```bash
npm run lint                 # TS checks, API then web
npm test                     # backend validation tests (not E2E)
npm run build                # API tsc + Vite production frontend
npm run migrate:workspaces   # review script + backup BEFORE running on existing DB
```

## Troubleshooting

- **Invalid email/password:** Confirm effective `MONGO_URL`; `nexpm` and `nexpm_demo_v096` are distinct. Check account existence without reading password hashes; use seed only for a disposable database.
- **Redis refused:** Host port is 6380 in the existing deployment, not stock 6379.
- **Port 4000/5173 busy:** Stop the older running `npm run dev` instance (`ss -ltnp | grep -E ':4000|:5173'`).
- **Application config inaccessible:** The login email must appear in server-side `PLATFORM_ADMIN_EMAILS`; organization admin alone is not platform admin.
- **Registration email missing:** Configure Resend via platform admin panel (v0.9.6.3 patch), or reviewed legacy `.env` fallback. Sender domain must be verified with provider.
- **No search result task title:** Ensure v0.9.6.2 patch is applied and tested.
- **ESBuild install-script warnings:** Review npm approval warnings and confirm Vite build succeeds.

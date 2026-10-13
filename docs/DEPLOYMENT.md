# GitHub publication and Ubuntu VPS deployment

> The existing Docker configuration is a starting point, **not a production security certification**. Back up and test on staging first.

## A. Prepare public or private GitHub repo

1. Review changes and remove real secrets, `.env` files, backups, dumps, log files, user uploads and deployment credentials.
2. Clean duplicate keys in `.env.example`, fix duplicate `migrate:workspaces` script entry in `apps/api/package.json`, and add/commit `apps/web/src/vite-env.d.ts` if missing. Align package versions consistently.
3. Inspect `.gitignore`; ensure `.env`, build output, `node_modules`, uploaded attachment directory, database files and backups are ignored.
4. Check git history: **if a secret was ever committed, removing it from the latest commit is not enough**. Rotate the credential and purge historical commits before publishing.
5. Run tests: `npm ci` (after committing lockfile), `npm run lint`, `npm test`, `npm run build`; confirm both Docker image builds on clean checkout.
6. Keep code in private repository until security test gates pass. Choose a license explicitly before open-source publication.
7. Initialize repository if necessary and push safely:

```bash
git init
git add .
git status --short
git commit -m "docs: document NexPM development baseline"
git branch -M main
git remote add origin git@github.com:YOUR_ORG/nexpm.git
git push -u origin main
```

Do not run git init/push blindly inside an existing repository. Use current remote and branch where already configured.

## B. Deploy to Ubuntu VPS (staging first)

1. Provision Ubuntu 24.04, non-root sudo user, firewall allowing SSH/80/443, regular OS updates, secure SSH keys and disk monitoring.
2. Install Docker Engine and Compose plugin; restrict Docker group membership.
3. Checkout a tagged tested commit in `/opt/nexpm` under deploy account. Create secure `.env` outside Git. Set HTTPS public URLs, CORS, random JWT and encryption keys, provider credentials.
4. Configure DNS records for your chosen hostname (e.g., `app.nexpm.app`); `.app` domains require HTTPS.
5. Review `compose.prod.yml`: Mongo/Redis private network only; API runs on internal port 4000; web/Nginx is mapped to `127.0.0.1:8080`. Ensure reverse proxy forwards both SPA and `/api` correctly. Validate Dockerfiles and Nginx routing.
6. Build and start: `docker compose -f compose.prod.yml up -d --build`; observe logs/health, then configure TLS via Caddy/Nginx reverse proxy.
7. **Do not run `npm run seed` or create default demo admin on public production.** Provision initial admin by safe bootstrap/onboarding workflow.
8. Back up MongoDB + stored files + encryption key securely; test full restoration. Configure alerts, log retention and update/rollback process.

Example Caddyfile (after DNS resolves):

```caddyfile
app.nexpm.app {
    reverse_proxy 127.0.0.1:8080
}
```

### Production hardening gates (must complete before real users)

- [ ] Confirm password reset/invitations, email verification and onboarding flows are safe without demo credentials.
- [ ] Review JWT/client token handling, CSRF/session policies, brute force protection, account recovery.
- [ ] Test organization/workspace isolation in **all** endpoints including search, files and calendar.
- [ ] Lock platform admin and prove a tenant admin cannot edit global credentials.
- [ ] Ensure uploads are scanned, sized, access-controlled and stored persistently outside ephemeral containers.
- [ ] Confirm provider credentials are encrypted, never returned to frontend and key rotations are documented.
- [ ] Add end-to-end browser tests for English/Arabic, RTL, light/dark, settings persistence, payments and mobile layouts.
- [ ] Test Stripe webhooks idempotency and subscription changes in Stripe test mode.
- [ ] Set up backup restore drill, uptime/exception monitoring and rollback procedure.
- [ ] Confirm privacy/terms, retention and access logs appropriate to your customers/jurisdiction.

## C. CI/CD

`.github/workflows/ci.yml` runs npm install, TypeScript checks, backend tests, production builds and Docker builds on push/PR. **It does not publish images or deploy**. Add protected deployment environments and explicit promotion/rollback steps only after staging readiness.

## D. Rollback example

Before a deployment: tag current commit, take DB and attachments backup, and capture deployment settings. On failure: stop new containers, restore prior tag/image, and restore DB only if schema/data changes require it. Validate API and web route health after rollback. Never blindly restore a DB over newer user data without a documented recovery decision.

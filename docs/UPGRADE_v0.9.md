# NexPM v0.9 development foundation — installation & actual status

**This is not a fully validated production release.** The source includes a corrected v0.5 TaskForm, new account/settings endpoints, session revocation, preferences, multi-workspace records and API foundations for planning. Background automation, recurrence execution, reminder email workers, automatic template application, multi-workspace enforcement of legacy endpoints, and full end-to-end testing remain incomplete. Do not deploy publicly yet.

## Safety first
Stop `npm run dev`. Back up the entire source directory and MongoDB before copying. Retain `.env`, `compose.dev.yml`, `node_modules` and the Docker named volumes. Keep your Redis host port 6380.

In Ubuntu WSL, use: `mongodump` from the Docker MongoDB container if installed: `docker compose -p nexpm -f compose.dev.yml exec -T mongo mongodump --archive --db nexpm > ~/nexpm-before-upgrade.archive`. Verify archive nonempty.

Use this package in a **separate test copy** of the project before overwriting the active NexPM installation. Do not launch two instances against the same database.

Run `npm install`, `npm run lint`, `npm test`, `npm run build`, then migrate the database using `npm run migrate:workspaces` (requires `.env` variables exported in the terminal). Migration is idempotent, but back up first.

New endpoints: `/api/workspaces`, `/api/planning`, `/api/custom-fields`, `/api/search`, `/api/timeline`, `/api/tasks/:id/comments`, `/api/tasks/:id/checklist`, `/api/tasks/:id/dependencies`; `/api/account/sessions`, `/api/account/change-password`, `/api/account/profile`, `/api/account/preferences`, `/api/account/request-email-change`, `/api/account/confirm-email-change`. Every route after `/api` authentication requires a valid JWT.

**Security limitations:** email change uses an in-memory 30-minute token map (development only); move to persistent hashed tokens before production. Files use local disk, requiring durable volume and malware scanning. Account sessions invalidate immediately on revoke, despite the UI example's suggested 10-minute lag. Existing signed-in users must sign in again after session tracking is enabled. Workspace permissions need broader coverage and ownership tests before enabling commercial tenants.

**Settings:** only English and Arabic available; several settings are saved preferences but not yet applied across every view. Reminder delivery, automatic rules, magic task entry, audio, and seasonal branding are not active features.

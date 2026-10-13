# NexPM v0.9.1 upgrade

1. Stop `npm run dev`. Back up source and MongoDB before upgrade.
2. Copy the five changed files under `apps/` and the two docs into the same paths in `~/projects/nexpm`.
3. Preserve `.env`, `compose.dev.yml`, MongoDB Docker volumes, `node_modules`, and your source-control files.
4. Run `npm run lint`, `npm test`, `npm run build`. Stop if any fail.
5. Run `set -a; source .env; set +a; npm run dev`.
6. Verify logo navigation, global search, profile menu and bell popover in English and Arabic.
7. Test that one user's read state does not affect another user and that organization A cannot access organization B search results.

New APIs (JWT required):
- `GET /api/search?q=text` (minimum 2 characters): `{projects,tasks,users}`.
- `GET /api/notifications`: `{items,unreadCount}` from recent organization activity.
- `PATCH /api/notifications/:id/read`: mark one activity as read.
- `POST /api/notifications/read-all`: mark recent activity items as read.

No environment variable or Compose changes are required.

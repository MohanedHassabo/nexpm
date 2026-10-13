# NexPM v0.9.3 upgrade — development patch

## Base version
Use after applying the **v0.9.2 Gantt patch** and **v0.9.1 TypeScript hotfix**. This patch changes three application files and adds these docs.

## Backup and installation
1. Stop the NexPM development process (Ctrl+C). Preserve all Docker containers and volumes.
2. `cd ~/projects && cp -a nexpm nexpm-backup-before-v093`
3. Copy the three files in `apps/` to their same relative paths under `~/projects/nexpm`.
4. Keep the local `.env`, `compose.dev.yml` (Redis 6380), `node_modules`, and lockfile.
5. Run `npm run lint`, `npm test`, and `npm run build` **one at a time**. Do not proceed past a failing command.
6. `set -a; source .env; set +a; npm run dev`

## Verification checklist
- On 375px wide viewport: drawer opens/closes; long nav list scrolls without moving footer out of bounds.
- User/manager Gantt: drag an eligible task bar sideways; due and start date persist after refresh.
- Grab right end of task bar to alter its duration. On touch devices use the edit dialog if dragging is difficult.
- Capture baseline, move bar, show/hide baseline. This is temporary; disappears after navigating away.
- Logged-in admin visits `/admin/config`, sees provider status without any secret values.
- Non-admin receives 403 from `/api/admin/config/status` and cannot open admin configuration page.
- Test English and Arabic layouts.

## Important security and functionality caveats
- Registration email uses Resend environment keys. The admin page reports whether keys exist; it does NOT validate credentials or send test mail.
- Dragged schedules are updated through the existing protected endpoints; project edits require their established permissions.
- No snapshot persistence or dependency scheduling logic has been added.
- This patch has not passed a complete dependency-backed CI verification in the authoring environment.

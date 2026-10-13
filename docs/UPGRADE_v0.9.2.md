# NexPM v0.9.2 – Editable Gantt development patch

## Version
0.9.2 (development patch over v0.9.1)

## Features added
- Click a task bar or task label to edit its start date, due date, status, and priority.
- Click a project bar or label to edit project dates/status/priority (admin/manager permissions enforced by existing API).
- Day/week timeline zoom and a Today scroll control.
- Independent horizontal scrolling and improved mobile touch targets.
- Save changes via existing authenticated PATCH /api/tasks/:id and PATCH /api/projects/:id endpoints, then refresh task/project queries.
- Date validation: due date cannot precede start date.

## Fixes
- Replaces the previously read-only Gantt bars with interactive, keyboard-focusable controls.

## Breaking changes
- None intended. No database schema migration.

## Installation (WSL)
1. Stop `npm run dev`, and back up the existing source folder.
2. Copy only `apps/web/src/App.tsx` and `apps/web/src/styles.css` into the same paths in `~/projects/nexpm`.
3. Keep `.env`, `compose.dev.yml`, `node_modules`, database volumes, and existing billing/backend files.
4. Run `npm run lint && npm test && npm run build`. Stop if any fails.
5. Restart NexPM and test `/gantt` on desktop and a mobile device.

## Verification status
Source patch prepared; dependency-backed TypeScript build and browser tests have not been completed here. Validate with your local npm installation.

## Known limitations / planned
- Drag-and-drop date movement and resizing, dependency arrows, critical path, baselines, and export are not implemented.
- Items without valid dates are excluded from the Gantt until they receive dates.
- Project editing is restricted by the existing server role guard.
- This patch does not include the separate requested admin-only application email configuration or full settings/mobile UI overhaul; those remain distinct pending tasks.

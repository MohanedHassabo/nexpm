# NexPM v0.9.5 — My Calendar

## Installation
Back up the existing project and MongoDB, then copy exactly the files provided in the patch. Preserve `.env`, `compose.dev.yml`, data volumes and local changes.

Run `npm install`, `npm run lint`, `npm test`, `npm run build` and then start the app.

## New navigation
- `/my-calendar` — personal month calendar (tasks and personal events).
- `/calendar` — Google/Outlook calendar connection settings.

## REST API (authenticated)
- `GET /api/my-calendar/events?from=<ISO>&to=<ISO>`
- `POST /api/my-calendar/events`
- `PATCH /api/my-calendar/events/:id`
- `DELETE /api/my-calendar/events/:id`

Create/edit JSON: `title`, `description`, `startsAt`, `endsAt`, `allDay`, `color`.
All events are scoped to the signed-in user and organization.

## Limitations
- External synced events are not yet aggregated.
- Event time selection and recurrence are not available.
- Existing tasks with deadlines appear in the monthly grid, but task editing remains on Tasks/Gantt.
- Run actual regression tests prior to production use.

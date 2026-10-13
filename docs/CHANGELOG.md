# NexPM Version History

## v0.9.3 — 2026-10-13 (Development patch; NOT a verified release)

### Added
- Gantt bar drag-to-shift and end-handle resize with PATCH to existing task/project API.
- Temporary in-browser schedule baseline capture, toggle and visual comparison.
- Admin-only Application Configuration diagnostics at `/admin/config`.
- Authenticated, role-restricted `GET /api/admin/config/status`; never exposes secret values.

### Changed
- Sidebar menu scrolls independently of header, search and footer.
- Mobile header, content, dialogs, tables and touch controls improved.

### Fixes
- Sidebar menu items being inaccessible on smaller viewports.

### Limitations and deferred functionality
- Gantt dependencies/arrows, critical-path computation, server-stored baselines, milestone markers and multi-user concurrency conflict checks are NOT implemented.
- Email credentials must still be configured by the server administrator in the `.env` (or secret manager); no browser-based secret editing or email test message yet.
- Personal settings for reminders/automation still need background services; not all stored preferences affect behavior.
- Complete RTL visual QA and mobile device testing remain outstanding.
- Source archive/syntax checked only; TypeScript, automated tests and browser verification must run on the user's WSL environment.

### Breaking changes
- None intended, but this is a development-only patch based on NexPM v0.9.2, not a production migration.

### Database migrations
- None. Baselines are local to the current Gantt page instance.

## v0.9.5 — My Calendar (development)
### Added
- Separate My Calendar navigation and month-by-month grid with day detail.
- Task deadlines shown alongside personal events.
- Create, edit and delete personal events; user+tenant scoped on the API.
- Arabic/English labels and RTL-aware responsive calendar scrolling.
### Changed
- Existing Google/Outlook integration renamed Calendar connections, remains at /calendar.
### Fixes
- Calendar connections are no longer the only calendar-related navigation item.
### Breaking changes
- None expected; additive endpoints and collection.
### Migration
- No migration; new personalcalendarevents collection created as events are added.
### Upgrade
- Copy changed files from patch, keep .env/Compose, run npm install, lint/test/build.
### Known limitations
- External Google/Outlook events do not yet appear in My Calendar.
- Day events are stored as all-day dates; timed editing and recurring events are pending.
- Configuration UI for platform email delivery is a separate incomplete workstream.

## v0.9.6-dev — Consolidated source bundle
- Merged available patches through v0.9.5.3.
- Fixed duplicated root `migrate:workspaces` script entry and aligned manifest version.
- Added upgrade, version history and release status documents.
- Not a certified implementation of the complete v0.9.6 specification.

# NexPM v0.9.4 — Settings feedback hotfix (development)

## Fixed
- Profile settings populate current name and avatar color from `/api/me` before editing.
- Profile save confirms server response and updates local form fields.
- Preferences save checks response and shows distinct saving/saved/error feedback.
- Appearance `system` theme responds to operating system theme changes.
- Settings page displays explicit warnings for preferences saved but not yet executed in application logic.

## Not yet functional
Email reminders and digest scheduling, default task view across routes, priority filtering across routes, quick-add modes, relationship defaults, sounds, seasonal logos and brightness controls require implementation. Privacy search preferences require integration into search endpoints.

## Installation
Back up `apps/web/src/App.tsx` and `apps/web/src/main.tsx`. Replace those two files only. Do not overwrite `.env`, Docker configuration or MongoDB data. Run `npm run lint`, `npm test`, `npm run build`, then browser-test account settings.

## Verification status
Source edits prepared; full TypeScript/runtime tests have not been run in the preparation environment. This hotfix does not claim that all settings are operational.

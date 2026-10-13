# NexPM v0.9.5.2 — RTL and Settings Defaults Hotfix

## Features / changes
- Material UI theme direction follows English (LTR) or Arabic (RTL) toggle immediately.
- Arabic-aligned form labels, selects, buttons, menus and calendar content.
- Numeric, email, time, Gantt timeline and NexPM Latin wordmark retain readable direction.
- Personal Settings fields initialize with explicit defaults before server preferences are loaded; stored values subsequently populate the controls.

## Fixes
- Select fields no longer replace valid falsy values by checking `||`; use nullish fallback.
- System language changes update theme direction without a full reload.

## Important limitations
- Backend application configuration remains diagnostic/read-only in v0.9.5; this hotfix does not implement admin secret editors.
- Settings not connected to features (reminder jobs, sounds, privacy checks, etc.) are still not functional simply because defaults display.
- RTL behavior requires visual testing on different browsers and phones.

## Upgrade
1. Back up current `apps/web/src` files.
2. Copy the four updated files in this archive over their matching paths.
3. Do not overwrite `.env`, `compose.dev.yml`, database volumes or `node_modules`.
4. Run `npm run lint && npm test && npm run build`.
5. Restart with `source .env` exported as appropriate; hard-refresh your browser.

## Breaking changes / database migrations
None. This is frontend-only.

## Verification status
Source patch created, compilation and RTL browser testing not independently verified.

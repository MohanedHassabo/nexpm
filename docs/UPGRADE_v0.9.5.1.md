# NexPM v0.9.5.1 — Translation TypeScript Hotfix

## Fixes
- Removes 9 duplicated Arabic translation keys introduced by the v0.9.5 My Calendar integration: Cancel, Delete, Edit, Task, Description, Start date, End date, Title and Today.
- Preserves existing Arabic strings and My Calendar translation entries.

## Upgrade
Replace **only** `apps/web/src/i18n.tsx` in your NexPM project. Do not overwrite `.env`, Compose files, databases or `node_modules`.

## Validation
Run `npm run lint && npm test && npm run build` from the NexPM project root.

## Verification status
Archive constructed from the v0.9.5 patch source, but a full dependency-backed TypeScript build is not verified in this package. No database migration is required.

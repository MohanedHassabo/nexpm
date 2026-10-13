# NexPM v0.9.1 TypeScript Hotfix

## Why this patch
Corrects four TypeScript errors after applying the navigation and notifications patch.

## Files
- apps/api/src/features.ts — missing workspace and planning API module restored from v0.9
- apps/api/src/account.ts — missing account-settings API module restored from v0.9
- apps/api/src/auth.ts — includes optional session ID in Auth and signToken typing; session verification
- apps/api/src/server.ts — corrects ObjectId types in notification bulkWrite

## Install
1. Back up current `apps/api/src` and do not overwrite `.env` or `compose.dev.yml`.
2. Copy the four files to `~/projects/nexpm/apps/api/src/`.
3. Run `npm run lint && npm test && npm run build`. If errors persist, stop and share output.
4. Before running the updated server against the database, review session behavior: the account system requires fresh logins and its security flows have not been fully integration tested.

## Verification
Static source checks only. Full TypeScript compilation and runtime tests must run locally.

## Known cautions
This is an integration fix, not proof of v0.9's production readiness. Earlier release requires full membership, migration, notification and security testing.

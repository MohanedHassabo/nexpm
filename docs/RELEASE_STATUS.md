# Source audit, tests and release status

Documentation snapshot: **2026-10-13**; target tree: consolidated v0.9.6 development baseline + v0.9.6.2 global-search + v0.9.6.3 Resend configuration patches. Documentation files here are intended for review and **do not change application code**.

## Known verification evidence

The user reported on WSL:

- `npm test`: 3/3 backend validation tests passed.
- `npm run build`: API TypeScript and Vite web build passed; 3490 modules built, production JavaScript chunk ~1.58 MB (gzip ~447 KB).
- `npm run lint`: initially failed due to missing Vite `ImportMeta.env` declarations; adding `vite-env.d.ts` was prescribed. Subsequent build uses `tsc -b` successfully.
- `nexpm_demo_v096`: demo database subsequently seeded with 12 users.

**Important:** The passing build predates v0.9.6.2 and v0.9.6.3 patches. These later patches require a fresh clean build and functional tests; no production certification is claimed.

## Pre-publish code issues observed in packaged artifacts

1. Consolidated zip missing `apps/web/src/vite-env.d.ts` (the working WSL tree was fixed manually).
2. API `package.json` has duplicate `migrate:workspaces` key in bundled source.
3. v0.9.6.3 `.env.example` repeats `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DEV_LOG_LINK`.
4. Original dev Compose maps Redis host 6379 while the user's original running Compose has been changed to 6380. Document this environment difference.
5. Repo/root/backend version numbers are inconsistent (root 0.9.6-dev; workspace 0.1.0; health endpoint 0.1.0).
6. Earlier user-reported defects remain: incomplete Arabic translations/RTL, dark active sidebar contrast, profile avatar color persistence, uneven Settings behavior.
7. Search/older CRUD routes must be audited for workspace permission enforcement before internet hosting.
8. Only three automated backend validation tests were reported; there are no claimed end-to-end security/UI test results.
9. Integration credentials/Stripe/calendar are optional and provider-dependent; not certified from compilation.
10. JavaScript bundle size warning suggests route-level lazy loading and dependency analysis.

## Document verification

Source inspected from available consolidated ZIP and subsequent patches. Exact running WSL source may differ because it is not directly accessible here. Compare documentation with your local repository and commit only after review.

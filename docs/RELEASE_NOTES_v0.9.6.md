# NexPM v0.9.6-dev — Consolidated source baseline

**Status: UNVERIFIED DEVELOPMENT SNAPSHOT, not a finished v0.9.6 release.**

This archive combines the existing v0.9 development source with the supplied patch sequence up to v0.9.5.3. It is not a claim that all features discussed for v0.9.6 are implemented.

## Incorporated sources
- v0.9 multi-workspace/account/planning development archive
- v0.9.1 navigation and notification patch plus TypeScript hotfix
- v0.9.2 Gantt editor and v0.9.3 Gantt/mobile/admin diagnostic patch
- v0.9.4 settings feedback hotfix
- v0.9.5 My Calendar, v0.9.5.1 dictionary hotfix, v0.9.5.2 RTL/defaults patch
- v0.9.5.3 dark dashboard CSS patch

## Not delivered as complete or verified
- Full English/Arabic translation and RTL accessibility audit
- Secure browser-editable SMTP/platform configuration and test-email delivery
- All personal setting effects, avatar photo upload, and account workflows end-to-end
- Dependency arrows, critical-path computation, persistent Gantt baselines
- Google/Outlook event two-way sync, recurring reminders/automation engine
- Cross-tenant/workspace security review and production hardening

## Validation
- Archive assembly and structural inspection: completed
- Dependency installation: timed out in the packaging environment
- TypeScript checks, unit tests, build, browser tests: **NOT RUN SUCCESSFULLY** on this combined snapshot

## Important
The latest source is *not* guaranteed to match locally modified files on your WSL system. Compare/merge in a separate test directory and keep your .env, Docker/Redis port mapping, database, secrets, and local changes.

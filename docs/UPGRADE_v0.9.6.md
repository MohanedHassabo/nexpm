# Upgrade / verification guide — v0.9.6-dev

1. Stop the NexPM dev server. **Do not stop or remove Frappe/Redis services.**
2. Back up existing app: `cp -a ~/projects/nexpm ~/projects/nexpm-backup-before-v096`.
3. Back up MongoDB separately using the existing Compose project.
4. Extract this archive to `~/projects/nexpm-v096-test` (do not overwrite the working tree).
5. Copy your **existing** `.env` only into the test location. It contains secrets; never publish it. Review `.env.example` for additional required keys.
6. Preserve the existing Redis host-port mapping (`6380`) and avoid starting a second Compose stack on ports 27017/6380. For an isolated integration test, use separate MongoDB and Redis ports/databases and Docker project names.
7. In the test directory, run `npm install`, `npm run lint`, `npm test`, `npm run build`. Stop on the first error.
8. Run migrations only against a **backed-up test database**, after examining their code and checking permissions.
9. Verify authentication, workspaces, tasks, settings, calendar, themes, mobile, RTL, Gantt and billing manually.
10. Merge into the main NexPM folder only after all tests pass.

### Rollback
Stop the test instance and restore the previous application source from the backup. Restore MongoDB from its backup only if a migration altered data. Do **not** delete volumes blindly.

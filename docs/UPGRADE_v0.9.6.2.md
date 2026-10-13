# NexPM v0.9.6.2 — Global Search Hotfix

## Fixes
- Task search results now show `Task.title` instead of nonexistent `Task.name`.
- Search results use `_id` as the React key (falling back to `id`).
- Backend global search matches task titles OR descriptions, case-insensitively.
- Task links retain the task project filter, rather than opening an individual task editor.

## Files
- `apps/web/src/App.tsx`
- `apps/api/src/features.ts`

## Breaking changes
None.

## Database migrations
None. No index additions.

## Upgrade
Back up the two target files, then copy the changed files into the same paths. Run `npm run lint && npm test && npm run build`, restart the development process and refresh the browser.

## Known limitations
- Selecting a task navigates to its project-filtered Tasks page; direct task opening is not yet implemented.
- The search interface does not currently receive team members from `/api/search`.
- Global search currently scopes by organization, but further workspace membership checks should be included before production deployment.
- No new search-specific automated tests have been added.

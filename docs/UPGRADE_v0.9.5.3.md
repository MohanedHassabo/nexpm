# NexPM v0.9.5.3 — Dark Mode & Dashboard Density

## Scope
CSS-only patch based on v0.9.5.2 `styles.css`. **Development / browser verification required**.

## Added / changed
- Restored KPI number contrast and dashboard secondary text contrast in dark mode.
- Darkened the global search input, dropdown results, tables, Kanban tasks and calendar surfaces.
- Reduced excess top/header and card padding on desktops.
- Used a compact two-column KPI layout on typical mobile screens.
- Preserved English/Arabic direction styling.

## Fixed
- Near-invisible dark KPI values.
- White global search input in dark layout.

## Breaking changes
None expected; styles only.

## Database migration
None. Do not replace `.env` or Docker Compose files.

## Upgrade
1. Back up `apps/web/src/styles.css`.
2. Replace it with the file in this patch.
3. Run `npm run lint && npm test && npm run build` from the NexPM project root.
4. Start `npm run dev` and hard-refresh the browser.
5. Visually inspect Dashboard in English and Arabic with Light, Dark, System themes at 320px, 390px, 768px and desktop widths.

## Limitations
This patch targets layout and color contrast only. It does not change dashboard data or personal settings behavior. CSS and archive checked; full browser testing must be done in your WSL environment.

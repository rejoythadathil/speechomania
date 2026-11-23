# reports

PDF reports for parents, rendered on the server from an EJS template (`common-service/reports/templates/progress-report.json.ejs`).

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/reports/children/:id/progress` | parent (own active child) | | PDF "<Child>’s learning report": stars, games played and trophies, games by colour level, every assigned game with times played and best stars, check-ins (scores only where the assessment lets parents see them), and the latest 20 notes the mentor shared with parents. Watermark and footer: "Prepared for <parent> · <date>" |

- Data comes only from the parent-scoped services (`learning`, `assessments`, `remarks`), so internal notes and hidden scores never reach the file. Another parent's child is 404; staff are 403.
- Named `speechomania_progress_<child>_<YYYY-MM-DD>.pdf`, sent with `no-store`, audited as `report.progress` with counts, and limited like every export (`common-service/reports`).
- `utils/index.js`: `progressData(...)` shapes the template data (hidden scores, dashes for unplayed games, note cap). `service/index.js`: `progressDocument` builds the filled template; `progressReport` renders and audits it.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `utils/index.js`, `tests/index.test.js`.

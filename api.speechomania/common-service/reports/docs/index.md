# reports

Shared pieces for files the API generates (Excel now, PDF next): names, limits and the response.

| File | Exports |
|---|---|
| `service/index.js` | `withRenderSlot(render)` (at most `RENDER_SLOTS` renders at once per process, `RENDER_QUEUE` waiting, then `reportsBusy` 503), `limitExports(user)` (`EXPORTS_PER_MINUTE` per person, counted in Valkey so it holds across API containers, then `tooManyExports` 429), `xlsxFile(sheets)` (`write-excel-file`), `fileResponse(c, { body, fileName, type })` (attachment, `no-store`) |
| `utils/index.js` | `reportFileName(kind, scope, extension, date)` → `speechomania_<kind>_<scope…>_<YYYY-MM-DD>.<extension>`, `everyRow(fetchPage)` (reads every page of a scoped list service; over `MAX_ROWS` is `tooManyRows` 400), `sheetOf(name, columns, rows)`, `dateCell`, `ageOn`, `wordsOf` |
| `constants/index.js` | `RENDER_SLOTS` 2, `RENDER_QUEUE` 8, `EXPORTS_PER_MINUTE` 10, `MAX_ROWS` 5000, `PAGE_SIZE` 100 |
| `exception/index.js` | `reportsBusy`, `tooManyExports`, `tooManyRows` |

Rows always come from the feature's own scoped list service, so a file never holds more than the person sees on screen. Benchmark (2026-11-23, laptop): 5,000 rows in about 56 ms and +16 MB; numbers in `.notes/decisions.md`.

Tests: `tests/index.test.js`.

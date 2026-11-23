# reports

Shared pieces for files the API generates (Excel and PDF): names, limits, templates and the response.

| File | Exports |
|---|---|
| `service/index.js` | `withRenderSlot(render)` (at most `RENDER_SLOTS` renders at once per process, `RENDER_QUEUE` waiting, then `reportsBusy` 503), `limitExports(user)` (`EXPORTS_PER_MINUTE` per person, counted in Valkey so it holds across API containers, then `tooManyExports` 429), `xlsxFile(sheets)` (`write-excel-file`), `pdfFile(definition, footerText)` (pdfmake with the PDF's built-in Helvetica, so no font files; file and URL access are switched off, so a template can never read the disk or the network; adds "<footer> · Page x of y"), `fileResponse(c, { body, fileName, type })` (attachment, `no-store`) |
| `utils/index.js` | `reportFileName(kind, scope, extension, date)` → `speechomania_<kind>_<scope…>_<YYYY-MM-DD>.<extension>`, `everyRow(fetchPage)` (reads every page of a scoped list service; over `MAX_ROWS` is `tooManyRows` 400), `sheetOf(name, columns, rows)`, `dateCell`, `ageOn`, `wordsOf`, `longDate`, `fillTemplate(template, data)` |
| `constants/index.js` | `RENDER_SLOTS` 2, `RENDER_QUEUE` 8, `EXPORTS_PER_MINUTE` 10, `MAX_ROWS` 5000, `PAGE_SIZE` 100 |
| `exception/index.js` | `reportsBusy`, `tooManyExports`, `tooManyRows` |

## Templates
`templates/<name>.json` is a pdfmake document (page, styles, watermark, content). Text may hold `{{path.to.value}}`. In an array, `{ "$each": "rows", "$as": "row", "$item": … }` repeats once per item and `{ "$if": "rows", "$then": …, "$else": … }` keeps a section only when the value is non-empty. Values are inserted as plain text. A new report is a new JSON file plus a function that shapes its data. The built-in fonts cover Latin text only; names in Indian scripts need an embedded font added here.

Rows always come from the feature's own scoped list service, so a file never holds more than the person sees on screen. Benchmark (2026-11-23, laptop): Excel 5,000 rows in about 56 ms and +16 MB; a 60-game PDF report in about 6 ms and 11 kB; numbers in `.notes/decisions.md`.

Tests: `tests/index.test.js`.

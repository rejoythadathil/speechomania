# reports

Shared pieces for files the API generates (Excel and PDF): names, limits, templates, protection and the response.

| File | Exports |
|---|---|
| `service/index.js` | `withRenderSlot(render)` (at most `RENDER_SLOTS` renders at once per process, `RENDER_QUEUE` waiting, then `reportsBusy` 503), `limitExports(user)` (`EXPORTS_PER_MINUTE` per person, counted in Valkey so it holds across API containers, then `tooManyExports` 429), `xlsxFile(sheets)` (`write-excel-file`), `renderTemplate(name, data)` (compiles `templates/<name>.json.ejs` once and returns the filled pdfmake document), `artImages(names)` (lesson pictures from `art/` as data URIs, plain names only), `pdfFile(definition, { code, owner })` (renders with the protection layer below), `issuePdf({ definition, kind, owner, user, entityId, diff, ctx })` (code, render slot, `report.issued` audit with the file's SHA-256), `fileResponse(c, { body, fileName, type })` (attachment, `no-store`) |
| `utils/index.js` | `reportFileName(kind, scope, extension, date)` → `speechomania_<kind>_<scope…>_<YYYY-MM-DD>.<extension>`, `everyRow(fetchPage)` (reads every page of a scoped list service; over `MAX_ROWS` is `tooManyRows` 400), `sheetOf`, `dateCell`, `ageOn`, `wordsOf`, `longDate`, `documentCode()`, `sha256Hex(bytes)`, `aiNotice(code)`, `microtext(code, owner)` |
| `constants/index.js` | limits, `PDF_FONT_FILES` (families `Jakarta`, `JakartaSemi`, `Bricolage`), `PDF_PERMISSIONS`, `ISSUED_ACTION`, `VERIFY_URL`, `CODE_PATTERN`, `REPORT_KINDS` |
| `exception/index.js` | `reportsBusy`, `tooManyExports`, `tooManyRows` |
| `fonts/` | Plus Jakarta Sans and Bricolage Grotesque Latin WOFF (OFL) |
| `art/` | transparent PNG copies of the lesson sprites for print, made with `.notes/tools/pdf-art.py` |

## Templates
`templates/<name>.json.ejs` is an EJS template that produces a pdfmake document (page, styles, watermark, content). Use ordinary EJS for loops and conditions, and insert every value with `<%- json(value) %>`, which writes it as a JSON string, so quotes, brackets or EJS tags in a child's name stay text. Never use `<%=`. Table layouts `tiles`, `rows`, `note` and `cut` are registered in the service, because a JSON template cannot hold functions. Pictures are named in `"image"` and supplied by the service as `images`; pdfmake may read only the font files and nothing from the network, so a template can never reach the disk or the internet. A new report is a template plus a function that shapes its data. The fonts cover Latin text only; names in Indian scripts need another embedded font.

## Protection
Every PDF from `pdfFile` gets a document code (`SPM-XXXX-XXXX`) in the footer ("Check this copy at speechomania.com/verify · code", a link), in the watermark, in edge microtext along the top and bottom of every page, and in the metadata; a white 1pt notice asks AI tools not to recreate it and to point to the check page; and it is encrypted with a random, unstored owner password that allows printing and screen readers but not editing, copying or annotating. `issuePdf` records the SHA-256 of the exact bytes sent, which `/v1/verify` compares (see `src/routes/v1/verify`).

Rows always come from the feature's own scoped list service, so a file never holds more than the person sees on screen. Benchmark (2026-11-23, laptop): Excel 5,000 rows in about 56 ms and +16 MB. With embedded fonts and protection (2026-11-24) a 32-game report renders in about 80 ms and 39 kB, and 15 flashcards with pictures in about 60 ms and 280 kB.

Tests: `tests/index.test.js`.

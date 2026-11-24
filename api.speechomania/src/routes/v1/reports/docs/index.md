# reports

PDFs for parents, rendered on the server from EJS templates in `common-service/reports/templates/` and issued with the protection layer described there.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/reports/children/:id/progress` | parent (own active child) | | PDF "<Child>’s learning report": stars, games played and trophies, colour levels with progress bars, every assigned game grouped by level with times played and best stars, check-ins (scores only where the assessment lets parents see them), and the latest 20 notes the mentor shared with parents |
| GET | `/reports/children/:id/lessons/:lessonId/cards` | parent (own active child, lesson assigned and published) | | PDF of the flashcard lesson: a cover with how-to-use tips and a picture index, then six cards a page with dashed cut lines. A lesson that is not flashcards (`player: 'cards'`) is 400 |

- Data comes only from the parent-scoped services (`learning`, `assessments`, `remarks`), so internal notes, hidden scores and unassigned lessons never reach a file. Another parent's child is 404; staff are 403.
- Named `speechomania_progress_<child>_<date>.pdf` and `speechomania_flashcards_<child>_<lesson>_<date>.pdf`, sent with `no-store`, limited like every export, and audited as `report.issued` (code, kind, sha256, bytes and counts) so `/verify` can check them.
- `utils/index.js`: `progressData` (games grouped by level, bars, hidden scores, note cap), `cardsData` (pages of six), `cardWords` (key words coloured, punctuation not), `placePictures` and `rowPictures` (picture positions per card; offsets in `constants/index.js`).
- `service/index.js`: `progressDocument` and `cardsDocument` build the filled templates; `progressReport` and `lessonCards` issue them.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `utils/index.js`, `tests/index.test.js`.

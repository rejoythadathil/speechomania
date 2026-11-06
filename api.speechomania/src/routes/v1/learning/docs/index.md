# learning

The API behind child mode. Parent only: the child has no login and plays inside the parent's session. Ownership is checked in the query (`children.parent_id`), so another parent's child is 404 and staff get 403.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/learning/children/:id` | | `{ id, display_name, sensory_settings, has_pin, stars, games_total, games_played, badges }`; `badges` lists the assigned games finished with at least `BADGE_SHARE` of their stars (`{ slug, title, player, cover }`), bounded by the child's assigned lessons |
| GET | `/learning/children/:id/lessons` | `page`, `page_size` | page of the child's assigned published lessons: `player`, `contrast`, `step_count`, `cover` (a pick lesson's first two characters), `cover_url` (signed link to the first uploaded picture), `cover_art`, `max_stars`, `times_completed`, `best_stars`, `locked_after` (`{ slug, title }` of the earlier part still to finish, or `null`) |
| GET | `/learning/children/:id/lessons/:lessonId` | | lesson content with a signed `audio.url` on every voiced line and a signed `image_url` on every step with a picture, and `steps_total` |
| GET | `/learning/children/:id/assessments` | `page`, `page_size` | page of the child's assigned published assessments: `title`, `question_count`, `players`, `due_on`, `done`, `can_start`, and `score` when the assessment shows it to the child |
| GET | `/learning/children/:id/assessments/:assessmentId` | | the questions (`items`) with signed audio, and the play settings (`tries`, `hints`, `shuffle`, `child_score`) |
| POST | `/learning/children/:id/attempts` | `lesson_id` or `assessment_id` (exactly one) | new attempt pinned to that lesson version, or to the assessment; 409 when the assessment is finished and retakes are off; 403 when the lesson's earlier part (`after`) is assigned to the child and not finished yet |
| PATCH | `/learning/attempts/:id` | `events` (max 50 per call), `steps_completed`, `completed` | the attempt; on completion the API sets the stars (lessons) or the score in `metadata.result` (assessments, returned as `result` when the child may see it); a finished lesson also returns `reward: { new_best, new_badge }`, compared with earlier finished attempts of the same lesson |
| POST | `/learning/children/:id/exit` | `pin` | `{ ok: true }` when the PIN matches or none is set |

## Rules (`utils/index.js`, `constants/index.js`)
- `stepsTotal`: a pick lesson has a Learn and a Show me page per step; a story lesson one page per step; a game plays `rounds` steps (a memory game plays `rounds` boards of three pairs), never more than it has.
- `starsFor`: one star per Show me page or game round (`play`) answered right on the first try; a finished story earns one.
- An attempt holds at most `MAX_EVENTS_PER_ATTEMPT` events. Event `step` is one of `EVENT_STEPS`.
- Assessment events (`step: 'assess'`) get their `points` on arrival, then lose the data points the assessment does not collect (`keepCollected`). Assessment attempts never earn stars, so they never change stars or badges.
- Starting and finishing an attempt are audited.

## Errors (`exception/index.js`)
- `learnerNotFound`, `lessonNotFound`, `attemptNotFound`, `assessmentNotFound` 404
- `attemptFinished`, `tooManyEvents`, `alreadyDone` 409
- `wrongPin` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `utils/index.js`, `exception/index.js`, `tests/index.test.js`.

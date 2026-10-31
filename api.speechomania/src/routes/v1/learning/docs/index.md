# learning

The API behind child mode. Parent only: the child has no login and plays inside the parent's session. Ownership is checked in SQL (`children.parent_id`), so another parent's child is 404 and staff get 403.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/learning/children/:id` | | `{ id, display_name, sensory_settings, has_pin, stars, games_total, games_played, badges }`; `badges` lists the assigned games finished with at least `BADGE_SHARE` of their stars (`{ slug, title, player, cover }`), bounded by the child's assigned lessons |
| GET | `/learning/children/:id/lessons` | `page`, `page_size` | page of the child's assigned published lessons: `player`, `contrast`, `step_count`, `cover` (a pick lesson's first two characters), `cover_url` (signed link to the first uploaded picture), `cover_art`, `max_stars`, `times_completed`, `best_stars` |
| GET | `/learning/children/:id/lessons/:lessonId` | | lesson content with a signed `audio.url` on every voiced line and a signed `image_url` on every step with a picture, and `steps_total` |
| POST | `/learning/children/:id/attempts` | `lesson_id` | new attempt pinned to that lesson version |
| PATCH | `/learning/attempts/:id` | `events` (max 50 per call), `steps_completed`, `completed` | the attempt; on completion the API sets the stars |
| POST | `/learning/children/:id/exit` | `pin` | `{ ok: true }` when the PIN matches or none is set |

## Rules (`utils/index.js`, `constants/index.js`)
- `stepsTotal`: a pick lesson has a Learn and a Show me page per step; a story lesson one page per step; a game plays `rounds` steps (a memory game plays `rounds` boards of three pairs), never more than it has.
- `starsFor`: one star per Show me page or game round (`play`) answered right on the first try; a finished story earns one.
- An attempt holds at most `MAX_EVENTS_PER_ATTEMPT` events. Event `step` is one of `EVENT_STEPS`.
- Starting and finishing an attempt are audited.

## Errors (`exception/index.js`)
- `learnerNotFound`, `lessonNotFound`, `attemptNotFound` 404
- `attemptFinished`, `tooManyEvents` 409
- `wrongPin` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `utils/index.js`, `exception/index.js`, `tests/index.test.js`.

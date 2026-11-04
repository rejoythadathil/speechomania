# assessments

Assessments built from lesson questions. Admins create, edit (drafts only), publish and archive them. Mentors assign published ones to the children they mentor and follow the results. Parents see their own children's results when the assessment allows it. Design: `.notes/11-assessments.md`.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/assessments` | admin, mentor | `status`, `q`, `page`, `page_size` | page of assessments with `question_count`, `max_score`, `assigned`, `completed` (mentors: published and archived only, counts for their children) |
| POST | `/assessments` | admin | `title`, `description`, `settings`, `items: [{ lesson_id, step_index, points? }]` | the draft; each question is copied from a published lesson |
| GET | `/assessments/:id` | admin, mentor | | the assessment with `items` (signed audio), `settings` with defaults filled in |
| PATCH | `/assessments/:id` | admin | `title`, `description`, `settings` (replaces the whole object), `items` | the draft; 409 when not a draft |
| POST | `/assessments/:id/publish` | admin | | published; 400 without questions |
| DELETE | `/assessments/:id` | admin | | 204: deletes a draft or archives a published assessment |
| POST | `/assessments/:id/assignments` | admin, mentor | `child_ids` (1–100), `due_on` | `{ assessment_id, assigned }`; each child must be in scope (404 otherwise); 409 when not published |
| DELETE | `/assessments/:id/assignments/:childId` | admin, mentor | | 204; past results are kept |
| GET | `/assessments/:id/results` | admin, mentor | `status` (`not_started`, `in_progress`, `completed`), `q`, `page`, `page_size` | page of assigned children in scope with `status`, `attempts`, `latest` score |
| GET | `/assessments/:id/summary` | admin, mentor | | `assigned`, `started`, `completed`, `average_percent`, `pass_rate`, and per question `accuracy` (right on the first try) |
| GET | `/children/:childId/assessments` | all (child scope) | `page`, `page_size` | the child's assessments with the latest result; parents get `score_hidden` and no score when the assessment hides it |
| GET | `/assessment-attempts/:attemptId` | all (child scope) | | one attempt question by question, with only the data points that were collected |

## Rules (`utils/index.js`, `constants/index.js`)
- Pickable games: `ASSESSABLE_PLAYERS`. Stories and memory cards have no single scored question. Shark and balloon questions also copy two sibling steps (`context`) as the wrong options.
- `withDefaults(settings)`: `DEFAULT_SETTINGS` fills every missing group and field.
- `pointsFor`: full points for a right first answer, `retry_points` for a right answer within `tries`, otherwise 0. `scoreAttempt` sums the last answer per question and sets `percent` and `passed` (null without a pass mark).
- `keepCollected` drops `choice`, `latency_ms` or `wrongs` when the assessment does not collect them. Whether an answer was right is always kept.
- Every create, update, publish, archive, assign and unassign is audited.

## Errors (`exception/index.js`)
- `assessmentNotFound`, `attemptNotFound` 404
- `onlyDraftsEditable`, `onlyDraftsPublishable`, `cannotRemove`, `notAssignable` 409
- `noItems`, `questionsUnavailable` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `utils/index.js`, `exception/index.js`, `tests/index.test.js`.

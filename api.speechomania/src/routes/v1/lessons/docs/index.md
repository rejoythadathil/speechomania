# lessons

Versioned lessons. One row per version (`slug` + `version`); at most one draft and one published per slug, and a published row never changes.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/lessons` | all | `status`, `q`, `page`, `page_size` | page of lessons; mentors see published, parents only lessons assigned to their children |
| POST | `/lessons` | admin | `slug`, `title`, `content`, `metadata` | draft version 1 |
| GET | `/lessons/:id` | all (same visibility) | | lesson with content |
| GET | `/lessons/:id/versions` | admin | `page`, `page_size` | page of versions |
| PATCH | `/lessons/:id` | admin | `title`, `content`, `metadata` | the draft |
| POST | `/lessons/:id/publish` | admin | | published; the previous one becomes `superseded` |
| POST | `/lessons/:id/draft` | admin | | new draft version copied from this one |
| DELETE | `/lessons/:id` | admin | | 204: deletes a draft or archives a published lesson |

## Content
- `player: 'story'`: `steps: [{ text, image_key?, audio? }]`.
- `player: 'pick'`: `contrast` (the coloured word, e.g. `can’t`), `lines` (`intro`, `quiz`, `retry`, `skip`, `outro`, `reward`), and steps with `text` (the question), `choices` (two of `LESSON_CHARACTERS`), `answer`, `actor` (who acts it out), `act` (one of `LESSON_ACTIONS`), `praise`, `teach`.
- Any line may carry `audio: { key, duration, words }`, filled by `bun run audio <slug>` into a draft.

## Errors (`exception/index.js`)
- `lessonNotFound` 404
- `slugTaken`, `onlyDraftsEditable`, `onlyDraftsPublishable`, `alreadyDraft`, `draftExists`, `cannotRemove` 409
- `noSteps` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.

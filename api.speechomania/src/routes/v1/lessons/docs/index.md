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
- Games (`rounds` 1–20, how many steps one play uses; any step may add `praise` and `sentence` lines):
  - Pictures: `art` (1–3 illustration names, lowercase with hyphens, matching files in the app's OpenMoji library) or `image_key` (an S3 key).
  - `shark`, `balloons` (`PICTURE_PLAYERS`): steps with `word` and a picture; at least three steps, because the others are the wrong options.
  - `yesno`: steps with a picture and `answer` true or false.
  - `match`: opposite pairs with `first`, `second` and two `art`; boards of `PAIRS_PER_BOARD`, so at least that many steps.
  - `bubbles`, `squish` (also `first`, `second`), `compare` (one `art` per choice), `place` (`art` is the thing and the place), `train` (the gap is `…`), `why` (`CHOICE_PLAYERS`): steps with `choices` (2–4 words) and an `answer` that is one of them.
- Any line may carry `audio: { key, duration, words }`, filled by `bun run audio <slug>` into a draft.

## Errors (`exception/index.js`)
- `lessonNotFound` 404
- `slugTaken`, `onlyDraftsEditable`, `onlyDraftsPublishable`, `alreadyDraft`, `draftExists`, `cannotRemove` 409
- `noSteps` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.

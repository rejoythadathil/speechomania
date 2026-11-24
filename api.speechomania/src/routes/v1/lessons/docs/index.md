# lessons

Versioned lessons. One row per version (`slug` + `version`); at most one draft and one published per slug, and a published row never changes.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/lessons` | all | `status`, `level`, `q`, `page`, `page_size` | page of lessons with `player` (the game), `level` (VIBGYOR colour from `content.level`, or `null`), `tag` (the game label shown to children from `content.tag`, or `null` for the game's own name) and `step_count`; mentors see published, parents only lessons assigned to their children |
| POST | `/lessons` | admin | `slug`, `title`, `content`, `metadata` | draft version 1 |
| POST | `/lessons/:id/voice` | admin | | records ElevenLabs voice for every line of a draft that has none (stored recordings are reused); returns the lesson with `voiced: { lines, generated }`. 409 if not a draft, 503 if voice is not set up |
| GET | `/lessons/:id` | all (same visibility) | | lesson with content; voiced lines carry a signed `audio.url` so the lesson page can play a preview, and `after_title` names the lesson it unlocks after (or `null`) |
| GET | `/lessons/:id/versions` | admin | `page`, `page_size` | page of versions |
| PATCH | `/lessons/:id` | admin | `title`, `content`, `metadata` | the draft |
| POST | `/lessons/:id/publish` | admin | | published; the previous one becomes `superseded` |
| POST | `/lessons/:id/draft` | admin | | new draft version copied from this one |
| DELETE | `/lessons/:id` | admin | | 204: moves a draft to Backup (`status: soft_deleted`, hidden everywhere) or archives a published lesson |

## Content
- `player: 'story'`: `steps: [{ text, image_key?, audio? }]`.
- Any lesson may set `after: '<slug>'`: when the child also has that lesson, this one stays locked until that one is finished once (part 1 before part 2).
- `player: 'cards'` (a part 1 flashcard lesson): steps are cards with `text` (read aloud), `art` (1–3 names), optional `keys` (words to colour), `colours` (one per key: `blue`, `orange`, `pink`, `green`, `red`, `yellow`, `brown`, `grey`), `layout` (`row` by default; a place word such as `in` or `under` needs `art: [thing, place]` and draws the thing in that spot) and `sizes` (one scale per picture, 0.3–2, for bigger and smaller). The API returns them as `cards`; other players return `cards: []`.
- `player: 'pick'`: `contrast` (the coloured word, e.g. `can’t`), `lines` (`intro`, `quiz`, `retry`, `skip`, `outro`, `reward`), and steps with `text` (the question), `choices` (two of `LESSON_CHARACTERS`), `answer`, `actor` (who acts it out), `act` (one of `LESSON_ACTIONS`), `praise`, `teach`.
- Every lesson except a story keeps a pool of steps; `rounds` (1–40) is how many one play uses, picked fresh each time (flashcards and `ordered` games keep the written order). Lessons and the list return `step_count` (the pool) and `per_play`.
- Games (`rounds`, how many steps one play uses; any step may add `praise` and `sentence` lines):
  - Pictures: `art` (1–3 illustration names, lowercase with hyphens, matching files in the app's OpenMoji library) or `image_key` (an S3 key).
  - `shark`, `balloons` (`PICTURE_PLAYERS`): steps with `word` and a picture; at least three steps, because the others are the wrong options.
  - `yesno`: steps with a picture and `answer` true or false.
  - `match`: opposite pairs with `first`, `second` and two `art`; boards of `PAIRS_PER_BOARD`, so at least that many steps.
  - `choose` (Which one?): steps with `choices` (2–6 words), one `art` per choice and an `answer`. The lesson may set `ordered: true` (rounds play in the written order, for graded games such as 2, then 3, then 6 pictures) and `labels: false` (no word under the pictures).
  - `bubbles`, `squish` (also `first`, `second`), `compare` (one `art` per choice), `place` (`art` is the thing and the place), `train` (the gap is `…`), `why` (`CHOICE_PLAYERS`): steps with `choices` (2–4 words) and an `answer` that is one of them.
- Any line may carry `audio: { key, duration, words }`, filled by `POST /lessons/:id/voice` (the Record voice button) or `bun run audio <slug>` into a draft. The signed `audio.url` and `image_url` a read returns are dropped when a draft is saved back. `lines.rest` is spoken on the break between sets.
- Publishing needs at least `MIN_ACTIVITIES` (5) in each play (`per_play`). The child plays any lesson in sets of 5 with a short celebration between sets; a short last set joins the one before (12 plays as 5 + 7).
- `editedInAdmin(slug)` (service) is true once any version was changed through `PATCH /lessons/:id`; `bun run lessons:sync` then leaves that lesson alone unless run with `--force`.

## Errors (`exception/index.js`)
- `lessonNotFound` 404
- `slugTaken`, `onlyDraftsEditable`, `onlyDraftsPublishable`, `alreadyDraft`, `draftExists`, `cannotRemove` 409
- `noSteps`, `tooFewActivities` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.

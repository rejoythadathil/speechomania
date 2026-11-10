# showcase

Public data for the landing page. No sign-in; only published lessons; no child, user or attempt data.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/showcase` | public | | `{ games, flashcards, stars_per_friend, medal_share, trophy_share, friends }`: counts of published game lessons and flashcards, and the reward rules from `learning/constants` |
| GET | `/showcase/games` | public | `page`, `page_size`, `players` (comma list of lesson players) | page of `{ slug, skill, player, example: { text, art, keys, layout } }`, one published game per player, in the order of `players` |

## Rules (`utils/index.js`)
- One game per player: the first published lesson by slug, so a family of lessons (Word bubbles, Word train) shows once.
- `skill` is the lesson title before `, part N:`.
- `example` is the first flashcard of the paired `<slug>-cards` lesson (its text, art, key words and layout), else the first step with a sentence, else the first step.
- Flashcard lessons (`player: 'cards'`) are never listed as games.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `utils/index.js`, `tests/index.test.js`.

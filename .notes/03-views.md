# Views
There are two visual worlds, and they never mix.

| | Work views | Child mode |
|---|---|---|
| Who | Admin, mentor, parent (incl. parent settings and child progress) | The child, inside a parent session |
| Look | Professional, dense, light theme: flat white panels with 1px hairline borders, 10px corners, no shadows, header bars with dividers, tables flush to the panel edge, stats as one joined strip, 8–12px between panels (reference: rightfit.so) | Interactive, playful, calm |
| Components | [BoardUI](https://www.boardui.com/) free MIT components only, no Pro (React Aria based, so keyboard and screen-reader support come built in): tables, forms, charts, sidebar, calendar | Our own components in `components/child/`, built for touch |
| Icons | BoardUI's icon set | [OpenMoji](https://openmoji.org/) colour SVGs, the same set as every child-mode picture, so controls and pictures share one style |
| Layouts | one `work-layout` whose sidebar changes by role | `learning-layout` (full screen) |

**Keeping them apart**
- Code lives in separate folders: `components/base/` and `components/foundations/` (BoardUI, added through its CLI and converted to JSX), `components/shared/` (our work-view pieces built on BoardUI) and `components/child/` (ours, child mode).
- If a work-view component isn't in BoardUI's free set, we build it ourselves in `components/shared/` with the same Tailwind v4 tokens, rather than buying Pro. Modal, stat card, panel and toast were built this way.
- An ESLint `no-restricted-imports` rule enforces it: `views/child/` and `components/child/` cannot import BoardUI. CI fails on a violation.
- The switch between worlds happens in one place only: the parent's "Start learning" action opens `learning-layout`, and leaving child mode needs the parent's PIN.

**Icons and decoration in child mode**
- One family only: every control icon (`components/child/child-icons.jsx`: lock, sound on and off, pause, arrows) and every picture is an OpenMoji colour SVG, so line weight and colours match.
- Every icon has a word next to it. An icon is never the only way to understand a button.
- One icon means one thing everywhere: the same icon for "next", "sound" and "break" on every screen.
- Decoration must belong to the game's world and stay still: one to three pieces at the edges (seaweed and coral at sea, a teddy in the playroom, books in the library). No floating, drifting or bobbing pictures, and no random extras such as butterflies, sparkles or rainbows. Movement is kept only where it is the game (fish swimming, balloons rising, cards turning) and stops when motion is off.
- How-to-play tips use pictures that show the action (a hand for "tap", eyes for "look", an arrow for "next page").
- Low colour intensity desaturates the whole child-mode screen.
- Large touch targets (at least 64 × 64 px) and a limited number of icons per screen.

- The child's learning mode is interactive (lessons, games, rewards). Parent settings are not part of learning mode.
- Accessibility for autistic learners is a requirement, not a polish item:
  - sensory-safe: reduced motion, no flashing, no autoplay surprises
  - volume/mute control and captions alongside every audio clip
  - predictable, consistent layouts; no countdown timers; no negative feedback
  - large tap targets, tablet-first
  - WCAG 2.2 AA
  - per-child sensory settings (motion, sound level, colour intensity) set by the parent
- Reports use 2–3 fixed templates.

## Lessons (all roles)
- **List (admin and mentor):** each row shows the title, slug, a small thumbnail and name of its game, version, steps, status and publish date.
- **Lesson page (admin, mentor, and parents for lessons assigned to their children):** what the child sees, read-only.
  - **Game:** the game's thumbnail, its name, the focus word, its three how-to-play tips and how many rounds one play uses.
  - **Rounds** (Pages for stories, Questions for Who can't?): every step as a card with its pictures, question, the right answer highlighted among the choices, the line said after it, and whether its voice is ready. Paged, twelve at a time.
  - **Spoken lines:** the start, question, wrong-answer, right-answer, end and reward lines with their voice status.
  - Admins also edit drafts (title and step text) and see versions; mentors request changes.
- **Child page:** assigned lessons show their game thumbnail and name and open the lesson page.

## Assessments (admin and mentor)
- **List:** title and points, questions, status, assigned and completed (mentors: their children only). Search and a status filter; admins create a draft from here.
- **Draft (admin):**
  - Details: title and notes for mentors, "Save draft".
  - Questions: each question as a round card with its source lesson, points, move up and down, remove. "Add questions" opens a picker: published lessons on the left (search, game thumbnail), the chosen lesson's questions on the right as checkboxes.
  - Settings: scoring numbers, then switches for play, data collected and who sees the score.
  - Publish, Delete draft, Play preview.
- **Published or archived:**
  - Summary strip: assigned, started, completed, average score, pass rate.
  - Children: each assigned child in scope with status, latest score (and pass or below pass mark), attempts and due date; open an attempt to see every answer, tries and time (only the data points that were collected); remove an assignment.
  - Question results: how often each question was answered right on the first try.
  - Questions as round cards, Settings read-only, and Assign (search children, optional due date).
- **Child page:** an Assessments panel with each assigned assessment, its status and latest score. Parents see the score and answers only when the assessment shares them.
- **Preview:** "Play preview" on the lesson and assessment pages opens the child's game full screen. Parent closes it; nothing is saved.

## Dashboard (admin and mentor)
Built around one question: which child needs attention today.
1. KPI row: children, waiting for a mentor (admin) or no lessons (mentor), need a remark (none in 14+ days), change requests. Plain counts, no percentages on small numbers.
2. Needs follow-up: children with a reason chip (no mentor, no remark for N days, no lessons), most urgent first.
3. Admin: mentor caseload, one bar per mentor split into "remark in last 14 days" and "overdue". Mentor: their remarks per week.
4. Admin: remarks per week (shared with parents vs internal) and enrolments per month; then unread remarks and change requests waiting.

## Sidebar and header
White sidebar with a hairline border (same colours as the rest of the work views), a filled blue active item, and count badges from `GET /v1/dashboard/badges` (children needing follow-up, pending change requests). Settings is not in the sidebar. A 64px sticky header shows the page name on the left and, on the right, the global search (Ctrl/⌘ K: pages, children, lessons and, for admins, people), the Audit log button (admins), the Settings button and the user's avatar, which also opens Settings (admins and mentors); the sidebar brand block is the same height so the two lines meet. On phones the header shows the menu button and the search. No theme toggle or settings yet: there is no dark mode or settings page.

## Settings (admins and mentors)
`/settings`, linked from the bottom of the sidebar and from the account card. Shows the profile (name, role, email, phone, date joined), role stats (mentor: children, remarks, change requests sent; admin: remarks, reviews), a form to change name and phone (`PATCH /v1/auth/me`, audited), and a password reset email. Email and role are read-only; only an admin changes those. The profile card has a default Speechomania cover (brand blue gradient with the logo's coral circle and blue stroke) shared by every profile. The avatar picker shows DiceBear Gaze faces; picking one saves it immediately.

## Avatars
- Staff (admins, mentors, parents) use DiceBear **Gaze** faces (CC0 licence), generated in the browser by `@dicebear/core` + `@dicebear/styles` in `components/shared/user-avatar.jsx`. No calls to the DiceBear API, so no user ids leave our servers.
- The seed is `users.metadata.avatar`, or the user id when none is chosen. The API returns it as `avatar` (`/auth/me`) and `author_avatar` (remarks).
- Children keep initials in work views. Child mode uses downloaded OpenMoji art (see Child mode).

## Child mode
Parents land here after signing in: `/learn` opens the only active child straight away, or shows "Who is learning today?" with an animal avatar per child and a small "Parent area" link. `/learn/:childId` is the child's space. Full screen, Lexend, the child's sensory settings applied. Every picture is a vector illustration from the downloaded OpenMoji library, named in the lesson content; no photos.
- **Check-ins:** when the child has assigned assessments, "Check-ins" sits above "Let's play!" inside the same frame: up to three cards (the first question's game world, a Check-in tag, Ready or Done, the title and the score when the child may see it), with arrows for more. A finished check-in without retakes is shown but can't be opened.
- **Check-in player:** the same player as lessons. Each question appears in its own game world; a wrong answer moves on once the allowed tries are used; the end screen shows the score only when allowed.
- **Games home (one unit):** a slim header (brand, sound, Break, Parent) over a soft sky with drifting clouds. Everything else sits in one flat white frame with hairline dividers, set in the work-view type: the head row has the avatar, "Hi, {name}" and a stat strip (stars, badges, games played); below it, "Let's play!" fills the left with thumbnail cards showing each game's own world, its tag, "Play next" or "New", the title and its stars; "My badges" runs down the right column inside the same frame. Three cards per row on desktop, two on tablet, one on phone, where the badges drop below the games; six per page with large arrows. No spoken greeting.
- **Lesson player:** every game has its own world from `components/child/scenes.js` (background colours plus OpenMoji scenery placed around the edges). The start page shows the game's generated scene (`assets/scenes/<player>.webp`, framed with a hairline) or, when the game has none yet, its OpenMoji art, large on one side and, on the other, the title, the intro line, three picture tips on how to play and "Play". Then the rounds, then "You did it!" with a trophy, the score in stars, confetti and a fanfare. Fixed positions on every screen: Parent (top left), round stars (top centre), sound and Break (top right), Say it again (bottom left). The caption under the top bar reads each line aloud and highlights the words.
- **Rounds:** a right answer plays a chime and confetti, says the praise or the full sentence, and moves on by itself. A wrong answer wobbles with a soft sound and says "Let's look again"; from the second wrong answer the right one glows. Story pages wait for Next.
- **Games, one per lesson:**
  - `shark` Feed the shark (action words): fish carry pictures; feed the one the shark asks for.
  - `balloons` Balloon pop (feelings): pop the balloon with the asked feeling.
  - `bubbles` Word bubbles (describing words): pick the word for the picture.
  - `squish` Word squish (short words): pick the short form; the two words squeeze into it under a clamp.
  - `compare` Bigger and smaller: two pictures, "Who is taller?"; the scale tips toward the answer.
  - `place` Put it there (where is it): hear "Put the cat under the box" and tap the spot; the cat moves there.
  - `match` Memory cards (opposites): turn two cards to find hot and cold, big and small.
  - `train` Word train (a or the): load the right wagon into the gap; the train leaves.
  - `yesno` Ask me: answer the question about the picture with thumbs up or down.
  - `why` Why detective: the picture opens under a magnifier; pick the reason.
  - `pick` Can and can't: tap who can't; the other one shows what it can do. Learn (errorless) then Show me.
  - `story`: one sentence per page with its picture.
- **Break:** a breathing circle and "I'm ready", returning to the same round.
- **Parent:** the parent's PIN, or press and hold for 2 seconds when no PIN is set, returns to the child's page.

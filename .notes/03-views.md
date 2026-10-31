# Views
There are two visual worlds, and they never mix.

| | Work views | Child mode |
|---|---|---|
| Who | Admin, mentor, parent (incl. parent settings and child progress) | The child, inside a parent session |
| Look | Professional, dense, light theme: flat white panels with 1px hairline borders, 10px corners, no shadows, header bars with dividers, tables flush to the panel edge, stats as one joined strip, 8–12px between panels (reference: rightfit.so) | Interactive, playful, calm |
| Components | [BoardUI](https://www.boardui.com/) free MIT components only, no Pro (React Aria based, so keyboard and screen-reader support come built in): tables, forms, charts, sidebar, calendar | Our own components in `components/child/`, built for touch |
| Icons | BoardUI's icon set | [Mochi Icons](https://mochi-icons.com/) (`mochi-icons`, MIT, sticker style) |
| Layouts | one `work-layout` whose sidebar changes by role | `learning-layout` (full screen) |

**Keeping them apart**
- Code lives in separate folders: `components/base/` and `components/foundations/` (BoardUI, added through its CLI and converted to JSX), `components/shared/` (our work-view pieces built on BoardUI) and `components/child/` (ours, child mode).
- If a work-view component isn't in BoardUI's free set, we build it ourselves in `components/shared/` with the same Tailwind v4 tokens, rather than buying Pro. Modal, stat card, panel and toast were built this way.
- An ESLint `no-restricted-imports` rule enforces it: `views/child/` and `components/child/` cannot import BoardUI, and nothing outside them can import `mochi-icons`. CI fails on a violation.
- The switch between worlds happens in one place only: the parent's "Start learning" action opens `learning-layout`, and leaving child mode needs the parent's PIN.

**Using Mochi Icons in child mode**
- Every icon has a word and a spoken audio label next to it. An icon is never the only way to understand a button.
- One icon means one thing everywhere: the same icon for "next", "replay audio" and "done" on every screen.
- Icon colour follows the child's sensory setting: the `primaryColor` prop uses a muted palette when "colour intensity" is low.
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
Parents land here after signing in: `/learn` opens the only active child straight away, or shows "Who is learning today?" with an animal avatar per child and a small "Grown-up area" link. `/learn/:childId` is the child's space. Full screen, Lexend, the child's sensory settings applied. Every picture is a vector illustration from the downloaded OpenMoji library, named in the lesson content; no photos.
- **Games home (one unit):** a slim header (brand, sound, Break, Grown-ups) over a soft sky with drifting clouds. Everything else sits in one flat white frame with hairline dividers, set in the work-view type: the head row has the avatar, "Hi, {name}" and a stat strip (stars, badges, games played); below it, "Let's play!" fills the left with thumbnail cards showing each game's own world, its tag, "Play next" or "New", the title and its stars; "My badges" runs down the right column inside the same frame. Three cards per row on desktop, two on tablet, one on phone, where the badges drop below the games; six per page with large arrows. No spoken greeting.
- **Lesson player:** every game has its own world from `components/child/scenes.js` (background colours plus OpenMoji scenery placed around the edges). The start page shows the game's art large on one side and, on the other, the title, the intro line, three picture tips on how to play and "Play". Then the rounds, then "You did it!" with a trophy, the score in stars, confetti and a fanfare. Fixed positions on every screen: Grown-ups (top left), round stars (top centre), sound and Break (top right), Say it again (bottom left). The caption under the top bar reads each line aloud and highlights the words.
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
- **Grown-ups:** the parent's PIN, or press and hold for 2 seconds when no PIN is set, returns to the child's page.

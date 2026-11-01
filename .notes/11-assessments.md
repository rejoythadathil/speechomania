# Assessments

Admins build assessments from questions in published lessons. Mentors hand them out to their children and watch the results. Parents see their child's scores. There is no proctoring: an assessment is a record you create, read, update and delete, played in child mode like a lesson.

## Roles
- **Admin:**
  - creates, edits (drafts only), publishes and archives assessments;
  - sets every scoring, play, data-collection and visibility option;
  - assigns to any child and sees every result.
- **Mentor:**
  - sees published assessments;
  - assigns them to the children they mentor, removes assignments;
  - sees results for their children only.
- **Parent:**
  - the child plays assigned assessments in child mode;
  - sees their own children's scores when the assessment allows it.

## Data
- New table `assessments`:
  - `title`, `description`;
  - `status`: `draft`, `published` or `archived`;
  - `items`: the questions, copied from lessons when they are added, so later lesson edits never change an assessment or its results;
  - `settings`: the admin's options (below);
  - `created_by`, `published_by`, `published_at`, `metadata`, timestamps.
- Each item keeps:
  - where it came from (`lesson_id`, `lesson_slug`, `lesson_version`, `lesson_title`, `step_index`);
  - the game (`player`, `contrast`) and the step itself;
  - the extra steps some games need as wrong options (`context`);
  - the lesson's short lines (`retry`, `skip`, `yes`);
  - its `points`.
- Pickable games: Who can't?, Feed the shark, Balloon pop, Word bubbles, Word squish, Weigh it up, Put it there, Word train, Yes or no, Detective. Stories and memory cards have no single question to score, so they can't be picked.
- `children.assigned_assessments`: `[{ assessment_id, due_on, assigned_by, assigned_at }]`.
- `attempts`:
  - `lesson_id` becomes optional and `assessment_id` is added;
  - a CHECK makes every attempt belong to exactly one of them;
  - the score, maximum, percent and pass result go in `metadata`; `stars` stays 0, so assessments never change a child's stars or badges.

## Settings (per assessment, admin only)
- **Scoring:**
  - `points` per question (default 1; each item can override);
  - `tries` per question (1 to 3);
  - `retry_points`, earned for a right answer after a wrong one;
  - `pass_percent` (empty means no pass mark).
- **Play:**
  - `shuffle` the questions;
  - `hints` (the right answer glows after two wrong tries);
  - `retakes` (play again after finishing).
- **Data collected:**
  - `answers`: which choice was tapped;
  - `time`: how long each question took;
  - `tries`: the wrong tries.
  - Whether each answer was right is always kept, because the score needs it.
  - The API drops anything switched off before saving, so the setting is enforced on the server.
- **Who sees the score:**
  - `parent_score`;
  - `child_score` (the end screen).

## Screens
- **Assessments list** (admin, mentor): title, questions, status, assigned, completed, average score.
- **Assessment page:**
  - the questions, each shown like a lesson round;
  - the settings;
  - a playable preview;
  - for admins, the builder: pick a lesson, tick its questions, set points, reorder.
  - Results: assigned, completed, average and pass rate, how often each question was answered right first time, and each child's status and latest score; open an attempt to see every answer.
  - Assign: search children (scoped), optional due date.
- **Child page:** an Assessments panel with each assessment, its status and latest score (parents see the score only when allowed).
- **Child mode:** assigned assessments sit at the top of the home in the same unit as the games; playing one shows each question in its own game.

## Out of scope
Proctoring, timers, question banks outside lessons, and grading by hand.

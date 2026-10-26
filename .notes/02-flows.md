# Core flows

## Onboarding
1. There is no public sign-up. An admin creates a mentor or parent account, and the system sends an invite email (Firebase email link).
2. The person sets a password and logs in.
3. The parent records consent (see Compliance) and adds child profiles.
4. The admin assigns each child to a mentor.

## Lesson lifecycle
1. An admin creates a lesson as a **draft**: visuals plus the script text.
2. The admin requests audio generation. A job is queued; the worker calls ElevenLabs, stores the audio in S3 and puts the S3 key into the lesson content. The S3 key is a hash of (text + voice + settings), so before calling ElevenLabs the worker checks whether that file already exists; the same audio is never generated or paid for twice.
3. The admin previews and **publishes**. Each version is its own row in `lessons` (same `slug`, next `version`). A published row is never edited.
4. A child's progress always points at the lesson version they took, so later edits never corrupt history.
5. Editing a published lesson creates a new draft version. It goes live only when published.

## Lesson change request
1. A mentor submits a request: lesson, version, proposed change and reason.
2. Admins are notified. The admin approves or rejects it with a note.
3. On approval, the admin applies the change as a new draft version and publishes it (step 5 above). The mentor sees the outcome on their request.

## Mentor reassignment
- The old mentor loses access immediately.
- Remarks and history stay with the child and are visible to the new mentor.
- `children.mentor_id` holds the current mentor; every change is written to `audit_logs`, which is the assignment history.

## Child lifecycle
`active → inactive → archived`. Archived children are hidden but kept for the retention period. Erasure is a separate flow (see Compliance).

## Reports
1. A user requests one of the fixed report templates (2–3 templates; layouts never vary).
2. The job goes onto the queue.
3. A worker renders the EJS template to HTML, then converts it to PDF using headless Chromium (Playwright) with network access disabled.
4. The PDF is stored in a private S3 bucket under the job id. The app polls the job and then downloads it through a short-lived signed link. There is no reports table; the queue and S3 hold everything.

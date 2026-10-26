# Product idea
We are building an autism learning platform called **Speechomania**, published by the company **Autism Synergies** and going live on the Speechomania website. It is not DCCD Global's product: the founder confirmed this on 2026-10-26. The client relationship is with deadend-engineers. It has 3 roles (RBAC): Admin, Mentor and Parent (who manages one or more Child profiles). Lessons are designed for autistic learners: every chapter or lesson is visual and creative, with audio. Audio is generated with ElevenLabs and stored. The MVP in `/Users/nijeesh/codes/dccd-mvp` shows the intended experience; run it before starting.

# Open decisions (settle before writing code)
| # | Decision | Proposed default |
|---|----------|------------------|
| 1 | Is the curriculum the same for every child? | Admin publishes lessons. A mentor assigns lessons per child from the published library. |
| 2 | Can parents see remarks? | Only remarks marked "shared with parent". Internal remarks stay between admins and mentors. |
| 3 | Notification channel | In-app counters come from data that already exists (unseen remarks, pending change requests); no notifications table. Email digest to admins once a day. |
| 4 | Mentor performance metrics | Remarks per child per week, child progress rate, change requests raised/approved. |

# Members
One organisation (Speechomania), three roles. This is role-based access control only; there is no multi-tenancy.

- ***Admin***: Owners of the Speechomania organisation. Full access.
- ***Mentor***: Each mentor is assigned N children. A mentor sees only their assigned children.
- ***Parent***: A parent account owns one or more ***Child*** profiles. The child does not have their own login; the child enters "learning mode" from the parent's session using a simple picture/PIN switch. Settings, progress and remarks stay behind the parent view.

## Permissions per role

#### Admin
- CRUD on lessons (with draft → published states and versions)
- CRUD on mentors
- CRUD on parents and child profiles (soft delete; hard delete only through the erasure flow)
- Assign and reassign children to mentors
- Analytics on every child and their mentor
- Mentor performance and contributions (metrics from Open decision 4)
- Report generation on mentors and children
- System analytics and data
- Approve or reject lesson change requests from mentors
- Write remarks on any child (internal or shared with parent). The child's mentor sees them.
- View the audit log

#### Mentor
- Read their assigned children's progress
- Add remarks on an assigned child (internal or shared with parent). Admins are notified.
- Request a change to a lesson, with a reason. It goes to admins as a request; the admin approves or rejects it.
- Assign published lessons to their children

#### Parent
- Manage their child profiles (name, avatar, sensory settings)
- View each child's progress and shared remarks
- Start a learning session for a child

#### Child (learning mode)
- Take lessons and earn rewards. The reward system only adds; nothing is lost or punished.

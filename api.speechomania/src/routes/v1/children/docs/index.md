# children

Child profiles. Scoped in SQL: admins see every child, mentors their assigned children, parents their own. A child outside your scope is 404.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/children` | all | `status`, `mentor_id`, `parent_id`, `unassigned`, `q`, `page`, `page_size` | page of children |
| POST | `/children` | admin, parent | `display_name`, `date_of_birth`, `sensory_settings` (`motion` normal/reduced, `sound` normal/quiet/off, `colour` normal/low), `consent_given: true`, `parent_id` (admin only) | child |
| GET | `/children/:id` | all | | child (view is audited) |
| PATCH | `/children/:id` | admin, parent | `display_name`, `date_of_birth`, `sensory_settings`, `status` (admin only), `pin` (parent only, 4 digits or `null`) | child |
| PUT | `/children/:id/mentor` | admin | `mentor_id` or `null` | child |
| PUT | `/children/:id/lessons` | admin, mentor | `slugs` (published lessons, in order) | child |
| DELETE | `/children/:id` | admin | | 204, archived and soft deleted |

- Mentors never receive the parent's email.
- The learning PIN is hashed into `children.pin_hash`; responses only say `has_pin`.
- Consent version comes from `CONSENT_VERSION`.

## Errors (`exception/index.js`)
- `childNotFound` 404
- `chooseParent`, `chooseActive(label)` 400: the parent or mentor is missing or not active
- `lessonsNotPublished(slugs)` 400

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.

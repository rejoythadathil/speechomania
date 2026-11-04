import { db } from '../common-service/db/service/index.js'

const demo = { metadata: { path: ['demo'], equals: true } }
const users = (await db.users.findMany({ where: demo, select: { id: true } })).map((u) => u.id)
const children = (await db.children.findMany({ where: demo, select: { id: true } })).map(
  (c) => c.id
)
const assessments = (await db.assessments.findMany({ where: demo, select: { id: true } })).map(
  (a) => a.id
)

const removed = await db.$transaction([
  db.attempts.deleteMany({
    where: { OR: [demo, { child_id: { in: children } }, { assessment_id: { in: assessments } }] }
  }),
  db.remarks.deleteMany({
    where: { OR: [demo, { child_id: { in: children } }, { author_id: { in: users } }] }
  }),
  db.change_requests.deleteMany({ where: { OR: [demo, { requested_by: { in: users } }] } }),
  db.audit_logs.deleteMany({ where: { OR: [demo, { actor_id: { in: users } }] } }),
  db.children.updateMany({ where: { mentor_id: { in: users } }, data: { mentor_id: null } }),
  db.children.deleteMany({ where: { id: { in: children } } }),
  db.assessments.deleteMany({ where: { id: { in: assessments } } }),
  db.users.deleteMany({ where: { id: { in: users } } })
])

const [attempts, remarks, requests, logs, , kids, tests, people] = removed.map((r) => r.count)
console.log(
  `Removed ${people} demo users, ${kids} children, ${tests} assessments, ${attempts} attempts, ${remarks} remarks, ${requests} change requests and ${logs} audit entries. Lessons are kept.`
)
await db.$disconnect()

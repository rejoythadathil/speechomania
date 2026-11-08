import { db } from '../../../../../common-service/db/service/index.js'
import { pageOf } from '../../../../../common-service/http/utils/index.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const titleOf = (model) => async (ids) =>
  (await model.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
    (row) => [row.id, row.title]
  )

const LABELS = {
  lesson: titleOf(db.lessons),
  assessment: titleOf(db.assessments),
  child: async (ids) =>
    (
      await db.children.findMany({
        where: { id: { in: ids } },
        select: { id: true, display_name: true }
      })
    ).map((row) => [row.id, row.display_name]),
  user: async (ids) =>
    (
      await db.users.findMany({ where: { id: { in: ids } }, select: { id: true, full_name: true } })
    ).map((row) => [row.id, row.full_name]),
  attempt: async (ids) =>
    (
      await db.attempts.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          child: { select: { display_name: true } },
          lesson: { select: { title: true } },
          assessment: { select: { title: true } }
        }
      })
    ).map((row) => [
      row.id,
      `${row.child.display_name} · ${row.lesson?.title ?? row.assessment?.title ?? ''}`
    ]),
  remark: async (ids) =>
    (
      await db.remarks.findMany({
        where: { id: { in: ids } },
        select: { id: true, child: { select: { display_name: true } } }
      })
    ).map((row) => [row.id, `About ${row.child.display_name}`]),
  change_request: async (ids) =>
    (
      await db.change_requests.findMany({
        where: { id: { in: ids } },
        select: { id: true, lesson: { select: { title: true } } }
      })
    ).map((row) => [row.id, row.lesson.title])
}

async function labelsFor(rows) {
  const byType = new Map()
  for (const row of rows) {
    if (!LABELS[row.entity_type] || !UUID.test(row.entity_id)) continue
    byType.set(row.entity_type, [...(byType.get(row.entity_type) ?? []), row.entity_id])
  }
  const found = await Promise.all(
    [...byType].map(async ([type, ids]) =>
      (await LABELS[type]([...new Set(ids)])).map(([id, label]) => [`${type}:${id}`, label])
    )
  )
  return new Map(found.flat())
}

export async function listAudit({ entity_type, entity_id, actor_id, action, ...window }) {
  const page = await pageOf(
    db.audit_logs,
    {
      where: { entity_type, entity_id, actor_id, action },
      select: {
        id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        diff: true,
        ip: true,
        request_id: true,
        created_at: true,
        actor_id: true,
        actor: { select: { full_name: true, role: true } }
      },
      orderBy: { id: 'desc' }
    },
    window
  )
  const labels = await labelsFor(page.items)
  return {
    ...page,
    items: page.items.map(({ id, actor, ...row }) => ({
      id: String(id),
      ...row,
      entity_label: labels.get(`${row.entity_type}:${row.entity_id}`) ?? null,
      actor_name: actor?.full_name ?? null,
      actor_role: actor?.role ?? null
    }))
  }
}

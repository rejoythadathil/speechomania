import { db } from '../../../../../common-service/db/service/index.js'
import { pageOf } from '../../../../../common-service/http/utils/index.js'

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
  return {
    ...page,
    items: page.items.map(({ id, actor, ...row }) => ({
      id: String(id),
      ...row,
      actor_name: actor?.full_name ?? null,
      actor_role: actor?.role ?? null
    }))
  }
}

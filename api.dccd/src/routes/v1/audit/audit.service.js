import { sql } from '../../../../common-service/db/index.js'
import { pageOf } from '../../../../utils.js'

export async function listAudit({ entity_type, entity_id, actor_id, action, ...window }) {
  const page = await pageOf(sql, sql`
    SELECT a.id::text AS id, a.id AS seq, a.action, a.entity_type, a.entity_id, a.diff, a.ip, a.request_id, a.created_at,
      a.actor_id, u.full_name AS actor_name, u.role AS actor_role
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.actor_id
    WHERE true
      ${entity_type ? sql`AND a.entity_type = ${entity_type}` : sql``}
      ${entity_id ? sql`AND a.entity_id = ${entity_id}` : sql``}
      ${actor_id ? sql`AND a.actor_id = ${actor_id}` : sql``}
      ${action ? sql`AND a.action = ${action}` : sql``}
  `, sql`list.seq DESC`, window)
  return { ...page, items: page.items.map(({ seq: _seq, ...row }) => row) }
}

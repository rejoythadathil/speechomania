import { json } from '../../http/utils/index.js'

export function audit(db, { actor, action, entityType, entityId, diff = null, ctx = {} }) {
  return db`
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, diff, ip, request_id)
    VALUES (${actor?.id ?? null}, ${action}, ${entityType}, ${String(entityId)}, ${json(diff)}::jsonb, ${ctx.ip ?? null}, ${ctx.requestId ?? null})
  `
}

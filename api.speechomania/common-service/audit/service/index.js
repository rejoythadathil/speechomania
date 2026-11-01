export function audit(tx, { actor, action, entityType, entityId, diff = null, ctx = {} }) {
  return tx.audit_logs.create({
    data: {
      actor_id: actor?.id ?? null,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      diff: diff ?? undefined,
      ip: ctx.ip ?? null,
      request_id: ctx.requestId ?? null
    },
    select: { id: true }
  })
}

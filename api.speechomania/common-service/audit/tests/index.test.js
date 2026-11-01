import { expect, test } from 'bun:test'
import { db } from '../../db/service/index.js'
import { fromPostgres } from '../../db/exception/index.js'
import { audit } from '../service/index.js'

test('audit writes a row the app role cannot change or delete', async () => {
  const entityId = crypto.randomUUID()
  await audit(db, {
    actor: null,
    action: 'test.audited',
    entityType: 'test',
    entityId,
    diff: { ok: true },
    ctx: { requestId: 'r-1' }
  })
  const row = await db.audit_logs.findFirst({
    where: { entity_id: entityId },
    select: { id: true, action: true, diff: true, request_id: true }
  })
  expect(row).toMatchObject({ action: 'test.audited', diff: { ok: true }, request_id: 'r-1' })
  const update = await db.audit_logs
    .update({ where: { id: row.id }, data: { action: 'changed' } })
    .catch((caught) => caught)
  expect(fromPostgres(update)?.status).toBe(403)
  const remove = await db.audit_logs.delete({ where: { id: row.id } }).catch((caught) => caught)
  expect(fromPostgres(remove)?.status).toBe(403)
})

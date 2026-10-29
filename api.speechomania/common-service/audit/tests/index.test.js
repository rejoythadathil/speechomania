import { expect, test } from 'bun:test'
import { sql } from '../../db/service/index.js'
import { fromPostgres } from '../../db/exception/index.js'
import { audit } from '../service/index.js'

test('audit writes a row the app role cannot change or delete', async () => {
  const entityId = crypto.randomUUID()
  await audit(sql, { actor: null, action: 'test.audited', entityType: 'test', entityId, diff: { ok: true }, ctx: { requestId: 'r-1' } })
  const [row] = await sql`SELECT id, action, diff, request_id FROM audit_logs WHERE entity_id = ${entityId}`
  expect(row).toMatchObject({ action: 'test.audited', diff: { ok: true }, request_id: 'r-1' })
  const update = await sql`UPDATE audit_logs SET action = 'changed' WHERE id = ${row.id}`.catch((caught) => caught)
  expect(fromPostgres(update)?.status).toBe(403)
  const remove = await sql`DELETE FROM audit_logs WHERE id = ${row.id}`.catch((caught) => caught)
  expect(fromPostgres(remove)?.status).toBe(403)
})

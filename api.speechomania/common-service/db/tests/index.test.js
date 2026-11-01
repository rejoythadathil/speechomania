import { describe, expect, test } from 'bun:test'
import { fromPostgres } from '../exception/index.js'
import { db } from '../service/index.js'

describe('db', () => {
  test('connects and round-trips jsonb', async () => {
    const value = { steps: [{ text: 'can’t' }], n: 2 }
    const { id } = await db.audit_logs.create({
      data: {
        action: 'test.json',
        entity_type: 'test',
        entity_id: crypto.randomUUID(),
        diff: value
      },
      select: { id: true }
    })
    const row = await db.audit_logs.findUnique({ where: { id }, select: { diff: true } })
    expect(row.diff).toEqual(value)
  })

  test('maps known Postgres errors to HTTP errors', async () => {
    const wrap = (code) => ({ meta: { driverAdapterError: { cause: { originalCode: code } } } })
    expect(fromPostgres(wrap('23505'))).toMatchObject({ status: 409 })
    expect(fromPostgres(wrap('42501'))).toMatchObject({ status: 403 })
    expect(fromPostgres({ code: 'P2034' })).toMatchObject({ status: 409 })
    expect(fromPostgres(wrap('99999'))).toBeNull()
    const error = await db.users
      .findUnique({ where: { id: 'not-a-uuid' } })
      .catch((caught) => caught)
    expect(fromPostgres(error)).toMatchObject({ status: 400 })
  })
})

import { describe, expect, test } from 'bun:test'
import { json } from '../../http/utils/index.js'
import { fromPostgres } from '../exception/index.js'
import { sql } from '../service/index.js'

describe('db', () => {
  test('connects and round-trips jsonb sent as text', async () => {
    const value = { steps: [{ text: 'can’t' }], n: 2 }
    const [{ one, data }] = await sql`SELECT 1 AS one, ${json(value)}::jsonb AS data`
    expect(one).toBe(1)
    expect(data).toEqual(value)
  })

  test('maps known Postgres errors to HTTP errors', async () => {
    expect(fromPostgres({ errno: '23505' })).toMatchObject({ status: 409 })
    expect(fromPostgres({ errno: '42501' })).toMatchObject({ status: 403 })
    expect(fromPostgres({ errno: '99999' })).toBeNull()
    const error = await sql`SELECT 'not-a-uuid'::uuid`.catch((caught) => caught)
    expect(fromPostgres(error)).toMatchObject({ status: 400 })
  })
})

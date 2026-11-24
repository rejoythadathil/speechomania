import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '../../../../app.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { sha256Hex } from '../../../../../common-service/reports/utils/index.js'
import { call, makeChild, makeUser } from '../../../../../test/helpers.js'
import { verdict } from '../utils/index.js'

let child, issued, bytes

async function report(user, childId) {
  const response = await app.request(`/v1/reports/children/${childId}/progress`, {
    headers: { authorization: `Bearer ${user.token}` }
  })
  return Buffer.from(await response.arrayBuffer())
}

beforeAll(async () => {
  const admin = await makeUser('admin')
  const mentor = await makeUser('mentor')
  const parent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  bytes = await report(parent, child.id)
  issued = await db.audit_logs.findFirst({
    where: { action: 'report.issued', entity_id: child.id },
    orderBy: { created_at: 'desc' }
  })
})

describe('verify', () => {
  test('anyone can check a code without signing in, and learns no names', async () => {
    const { status, body } = await call(null, 'GET', `/verify/${issued.diff.code.toLowerCase()}`)
    expect(status).toBe(200)
    expect(body).toMatchObject({
      status: 'issued',
      code: issued.diff.code,
      kind: 'Learning report'
    })
    expect(Object.keys(body).sort()).toEqual(['code', 'issued_on', 'kind', 'status'])
    expect(JSON.stringify(body)).not.toContain(child.id)
  })

  test('an unknown or malformed code is reported as such', async () => {
    expect((await call(null, 'GET', '/verify/SPM-AAAA-AAAA')).body).toEqual({
      status: 'unknown',
      code: 'SPM-AAAA-AAAA'
    })
    expect((await call(null, 'GET', '/verify/not-a-code')).status).toBe(400)
  })

  test('the exact issued file is genuine', async () => {
    const { body } = await call(null, 'POST', '/verify', { sha256: sha256Hex(bytes) })
    expect(body).toMatchObject({ status: 'genuine', code: issued.diff.code })
  })

  test('a changed copy of an issued document is flagged in the audit log', async () => {
    const changed = Buffer.concat([bytes, Buffer.from('\n% edited')])
    const { body } = await call(null, 'POST', '/verify', {
      sha256: sha256Hex(changed),
      code: issued.diff.code
    })
    expect(body).toMatchObject({ status: 'changed', code: issued.diff.code })
    const flagged = await db.audit_logs.findFirst({
      where: { action: 'report.flagged', entity_id: child.id }
    })
    expect(flagged.diff).toMatchObject({ code: issued.diff.code, kind: 'progress' })
  })

  test('a file that was never issued is unknown', async () => {
    const { body } = await call(null, 'POST', '/verify', { sha256: 'a'.repeat(64) })
    expect(body).toEqual({ status: 'unknown', code: null })
    expect((await call(null, 'POST', '/verify', { sha256: 'nope' })).status).toBe(400)
  })

  test('verdicts prefer an exact match over a code', () => {
    const row = { created_at: new Date('2026-11-23T10:00:00Z'), diff: { code: 'C', kind: 'cards' } }
    expect(verdict({ match: row, issued: row }).status).toBe('genuine')
    expect(verdict({ issued: row })).toMatchObject({ status: 'changed', kind: 'Flashcards' })
  })
})

import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'

let admin, mentor, parent, other, child

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
  other = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  await call(mentor, 'POST', `/children/${child.id}/remarks`, {
    body: 'Doing well',
    visibility: 'shared'
  })
  const lesson = await makePublishedLesson(admin)
  await db.attempts.create({ data: { child_id: child.id, lesson_id: lesson.id, steps_total: 15 } })
})

describe('account deletion', () => {
  test('only parents ask for deletion', async () => {
    expect((await call(null, 'POST', '/account/deletion', {})).status).toBe(401)
    expect((await call(mentor, 'POST', '/account/deletion', {})).status).toBe(403)
    expect((await call(admin, 'GET', '/account/deletion')).status).toBe(403)
  })

  test('a parent asks, sees the request, and asking again keeps the first', async () => {
    expect((await call(parent, 'GET', '/account/deletion')).body.request).toBeNull()
    const first = await call(parent, 'POST', '/account/deletion', { reason: 'Moving on' })
    expect(first.status).toBe(201)
    expect(first.body.request).toMatchObject({ status: 'pending', reason: 'Moving on' })
    const again = await call(parent, 'POST', '/account/deletion', {})
    expect(again.body.request.requested_at).toBe(first.body.request.requested_at)
    expect((await call(other, 'GET', '/account/deletion')).body.request).toBeNull()
  })

  test('a parent can cancel their own request', async () => {
    await call(other, 'POST', '/account/deletion', {})
    expect((await call(other, 'DELETE', '/account/deletion')).body.request).toBeNull()
    expect((await call(other, 'GET', '/account/deletion')).body.request).toBeNull()
    expect((await call(parent, 'GET', '/account/deletion')).body.request.status).toBe('pending')
  })

  test('only admins see, decline or erase requests', async () => {
    expect((await call(mentor, 'GET', '/users?deletion=pending')).status).toBe(403)
    expect((await call(mentor, 'POST', `/users/${parent.id}/erase`)).status).toBe(403)
    expect(
      (await call(parent, 'POST', `/users/${parent.id}/deletion/decline`, { note: 'x' })).status
    ).toBe(403)
    const list = await call(admin, 'GET', '/users', undefined, {
      deletion: 'pending',
      page_size: 100
    })
    expect(list.body.items.map((row) => row.id)).toContain(parent.id)
    expect(list.body.items.map((row) => row.id)).not.toContain(other.id)
    expect((await call(admin, 'GET', '/dashboard/badges')).body['/people/parent']).toBeGreaterThan(
      0
    )
    expect((await call(mentor, 'GET', '/dashboard/badges')).body['/people/parent']).toBeUndefined()
  })

  test('erase needs a pending request', async () => {
    expect((await call(admin, 'POST', `/users/${other.id}/erase`)).status).toBe(409)
    expect((await call(admin, 'POST', `/users/${mentor.id}/erase`)).status).toBe(404)
  })

  test('declining keeps the account and tells the parent why', async () => {
    const third = await makeUser('parent')
    await call(third, 'POST', '/account/deletion', {})
    const declined = await call(admin, 'POST', `/users/${third.id}/deletion/decline`, {
      note: 'Please confirm by phone first'
    })
    expect(declined.status).toBe(200)
    const { request } = (await call(third, 'GET', '/account/deletion')).body
    expect(request).toMatchObject({ status: 'declined', note: 'Please confirm by phone first' })
    expect((await call(admin, 'POST', `/users/${third.id}/erase`)).status).toBe(409)
    const again = await call(third, 'POST', '/account/deletion', {})
    expect(again.body.request.status).toBe('pending')
  })

  test('erasing removes the children, their progress and remarks, and the personal details', async () => {
    const erased = await call(admin, 'POST', `/users/${parent.id}/erase`)
    expect(erased.status).toBe(204)
    expect(await db.children.count({ where: { parent_id: parent.id } })).toBe(0)
    expect(await db.attempts.count({ where: { child_id: child.id } })).toBe(0)
    expect(await db.remarks.count({ where: { child_id: child.id } })).toBe(0)
    const row = await db.users.findUnique({ where: { id: parent.id } })
    expect(row).toMatchObject({
      firebase_uid: null,
      full_name: 'Erased account',
      phone: null,
      status: 'disabled'
    })
    expect(row.email).not.toBe(parent.email)
    expect(row.deleted_at).not.toBeNull()
    expect((await call(parent, 'GET', '/auth/me')).status).toBe(401)
    expect((await call(admin, 'GET', `/users/${parent.id}`)).status).toBe(404)
    const log = await db.audit_logs.findFirst({
      where: { entity_id: parent.id, action: 'user.erased' }
    })
    expect(log.diff).toEqual({ children: 1, attempts: 1, remarks: 1 })
  })
})

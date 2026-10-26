import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makeUser } from './helpers.js'

let admin, mentor, parent

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
})

describe('users', () => {
  test('requests without a token are rejected', async () => {
    expect((await call(null, 'GET', '/auth/me')).status).toBe(401)
  })

  test('only admins can list or create users', async () => {
    expect((await call(mentor, 'GET', '/users')).status).toBe(403)
    expect((await call(parent, 'POST', '/users', { email: 'x@test.dccd.local', full_name: 'X', role: 'admin' })).status).toBe(403)
    expect((await call(admin, 'GET', '/users?role=mentor')).status).toBe(200)
  })

  test('admin invites a mentor and gets an invite link', async () => {
    const email = `invite.${crypto.randomUUID().slice(0, 8)}@test.dccd.local`
    const created = await call(admin, 'POST', '/users', { email, full_name: 'New Mentor', role: 'mentor' })
    expect(created.status).toBe(201)
    expect(created.body.user.status).toBe('invited')
    expect(created.body.invite_link).toContain('oobCode')
    expect((await call(admin, 'POST', '/users', { email, full_name: 'Again', role: 'mentor' })).status).toBe(409)
  })

  test('invalid input lists the fields', async () => {
    const response = await call(admin, 'POST', '/users', { email: 'not-an-email', role: 'owner' })
    expect(response.status).toBe(400)
    expect(response.body.error.details.map((d) => d.field).sort()).toEqual(['email', 'full_name', 'role'])
  })

  test('admin cannot disable or delete their own account', async () => {
    expect((await call(admin, 'PATCH', `/users/${admin.id}`, { status: 'disabled' })).status).toBe(400)
    expect((await call(admin, 'DELETE', `/users/${admin.id}`)).status).toBe(400)
  })

  test('deleting a mentor unassigns their children and blocks their sign-in', async () => {
    const leaving = await makeUser('mentor')
    const child = await makeChild(parent, admin, leaving)
    expect((await call(admin, 'DELETE', `/users/${leaving.id}`)).status).toBe(204)
    expect((await call(admin, 'GET', `/children/${child.id}`)).body.mentor_id).toBeNull()
    expect([401, 403]).toContain((await call(leaving, 'GET', '/auth/me')).status)
  })

  test('a parent with children cannot be deleted', async () => {
    const busy = await makeUser('parent')
    await makeChild(busy, admin)
    expect((await call(admin, 'DELETE', `/users/${busy.id}`)).status).toBe(409)
  })
})

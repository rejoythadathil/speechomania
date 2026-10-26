import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makeUser } from './helpers.js'

let admin, mentor, otherMentor, parent, child

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
})

describe('remarks', () => {
  test('assigned mentors and admins can write remarks; others cannot', async () => {
    expect((await call(mentor, 'POST', `/children/${child.id}/remarks`, { body: 'Good focus today', visibility: 'shared' })).status).toBe(201)
    expect((await call(admin, 'POST', `/children/${child.id}/remarks`, { body: 'Internal admin note' })).status).toBe(201)
    expect((await call(otherMentor, 'POST', `/children/${child.id}/remarks`, { body: 'Not mine' })).status).toBe(404)
    expect((await call(parent, 'POST', `/children/${child.id}/remarks`, { body: 'Parent note' })).status).toBe(403)
  })

  test('parents only see shared remarks', async () => {
    const forParent = await call(parent, 'GET', `/children/${child.id}/remarks`)
    expect(forParent.body.items.length).toBe(1)
    expect(forParent.body.items[0].visibility).toBe('shared')
    const forMentor = await call(mentor, 'GET', `/children/${child.id}/remarks`)
    expect(forMentor.body.items.length).toBe(2)
  })

  test('only the author edits; author or admin deletes', async () => {
    const { body: remark } = await call(mentor, 'POST', `/children/${child.id}/remarks`, { body: 'Draft note' })
    expect((await call(otherMentor, 'PATCH', `/remarks/${remark.id}`, { body: 'Hijack' })).status).toBe(404)
    expect((await call(admin, 'PATCH', `/remarks/${remark.id}`, { body: 'Admin edit' })).status).toBe(403)
    expect((await call(mentor, 'PATCH', `/remarks/${remark.id}`, { body: 'Edited note' })).body.body).toBe('Edited note')
    expect((await call(admin, 'DELETE', `/remarks/${remark.id}`)).status).toBe(204)
  })

  test('mentor remarks are unread for admins until marked seen; admin remarks are not', async () => {
    const { body: remark } = await call(mentor, 'POST', `/children/${child.id}/remarks`, { body: 'Please review' })
    const unread = await call(admin, 'GET', '/remarks/unread')
    expect(unread.body.items.some((item) => item.id === remark.id)).toBe(true)
    expect(unread.body.items.some((item) => item.preview === 'Internal admin note')).toBe(false)
    await call(admin, 'POST', `/remarks/${remark.id}/seen`)
    const after = await call(admin, 'GET', '/remarks/unread')
    expect(after.body.items.some((item) => item.id === remark.id)).toBe(false)
    expect((await call(mentor, 'GET', '/remarks/unread')).status).toBe(403)
  })
})

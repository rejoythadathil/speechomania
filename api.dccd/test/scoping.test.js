import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makePublishedLesson, makeUser } from './helpers.js'

let admin, mentor, otherMentor, parent, otherParent, child, assigned, unassigned

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  assigned = await makePublishedLesson(admin)
  unassigned = await makePublishedLesson(admin)
  await call(admin, 'PUT', `/children/${child.id}/lessons`, { slugs: [assigned.slug] })
})

describe('pagination contract', () => {
  test('every list returns the same page shape and honours page_size', async () => {
    for (const path of ['/users', '/children', '/lessons', '/change-requests', '/audit', '/remarks/unread', `/children/${child.id}/remarks`, '/dashboard/follow-up']) {
      const { status, body } = await call(admin, 'GET', path, undefined, { page: 1, page_size: 2 })
      expect(status).toBe(200)
      expect(body).toMatchObject({ page: 1, page_size: 2 })
      expect(body.items.length).toBeLessThanOrEqual(2)
      expect(body.total_pages).toBe(Math.max(1, Math.ceil(body.total / 2)))
    }
  })

  test('a page past the end still reports the real total', async () => {
    const first = await call(admin, 'GET', '/users', undefined, { page_size: 1 })
    const far = await call(admin, 'GET', '/users', undefined, { page: 9999, page_size: 1 })
    expect(far.body.items).toEqual([])
    expect(far.body.total).toBe(first.body.total)
  })

  test('page_size above 100 is rejected', async () => {
    expect((await call(admin, 'GET', '/children', undefined, { page_size: 500 })).status).toBe(400)
  })
})

describe('domain scoping', () => {
  test('parents only see lessons assigned to their own children', async () => {
    const mine = await call(parent, 'GET', '/lessons', undefined, { page_size: 100 })
    expect(mine.body.items.map((lesson) => lesson.id)).toEqual([assigned.id])
    expect((await call(parent, 'GET', `/lessons/${unassigned.id}`)).status).toBe(404)
    expect((await call(otherParent, 'GET', `/lessons/${assigned.id}`)).status).toBe(404)
  })

  test('mentors do not receive parent emails, admins and the parent do', async () => {
    expect((await call(mentor, 'GET', `/children/${child.id}`)).body.parent_email).toBeNull()
    expect((await call(admin, 'GET', `/children/${child.id}`)).body.parent_email).toBe(parent.email)
    expect((await call(parent, 'GET', `/children/${child.id}`)).body.parent_email).toBe(parent.email)
  })

  test('a mentor moved off a child can no longer edit or delete their remarks there', async () => {
    const { body: remark } = await call(mentor, 'POST', `/children/${child.id}/remarks`, { body: 'Before the move', visibility: 'internal' })
    await call(admin, 'PUT', `/children/${child.id}/mentor`, { mentor_id: otherMentor.id })
    expect((await call(mentor, 'PATCH', `/remarks/${remark.id}`, { body: 'Edited later' })).status).toBe(404)
    expect((await call(mentor, 'DELETE', `/remarks/${remark.id}`)).status).toBe(404)
    expect((await call(admin, 'DELETE', `/remarks/${remark.id}`)).status).toBe(204)
  })

  test('a mentor cannot page through another mentor\'s remarks or follow-up list', async () => {
    expect((await call(mentor, 'GET', `/children/${child.id}/remarks`)).status).toBe(404)
    const followUp = await call(mentor, 'GET', '/dashboard/follow-up', undefined, { page_size: 100 })
    expect(followUp.body.items.some((item) => item.id === child.id)).toBe(false)
  })
})

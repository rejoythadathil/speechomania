import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, googleUser, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'

const body = { child_name: 'Meera', consent_given: true }
let admin, lesson

beforeAll(async () => {
  admin = await makeUser('admin')
  lesson = await makePublishedLesson(admin)
})

describe('signup', () => {
  test('needs a Google sign-in', async () => {
    expect((await call(null, 'POST', '/signup', body)).status).toBe(401)
    const outsider = await makeUser('parent')
    await db.users.delete({ where: { id: outsider.id } })
    expect((await call(outsider, 'POST', '/signup', body)).status).toBe(403)
  })

  test('invited accounts cannot sign up again', async () => {
    expect((await call(admin, 'POST', '/signup', body)).status).toBe(403)
  })

  test('needs a child name and consent', async () => {
    const google = await googleUser()
    expect(
      (await call(google, 'POST', '/signup', { child_name: ' ', consent_given: true })).status
    ).toBe(400)
    expect((await call(google, 'POST', '/signup', { child_name: 'Meera' })).status).toBe(400)
    expect(await db.users.count({ where: { email: google.email } })).toBe(0)
  })

  test('creates a parent and a child with no mentor and every published game', async () => {
    const google = await googleUser()
    const { status, body: created } = await call(google, 'POST', '/signup', body)
    expect(status).toBe(201)
    expect(created.child.display_name).toBe('Meera')
    const parent = await db.users.findUnique({ where: { email: google.email } })
    expect(parent.role).toBe('parent')
    expect(parent.status).toBe('active')
    const child = await db.children.findUnique({ where: { id: created.child.id } })
    expect(child.parent_id).toBe(parent.id)
    expect(child.mentor_id).toBeNull()
    expect(child.consent_version).toBe('v1')
    const published = await db.lessons.count({ where: { status: 'published' } })
    expect(child.assigned_lessons).toHaveLength(published)
    expect(child.assigned_lessons).toContain(lesson.slug)

    const me = await call(google, 'GET', '/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.role).toBe('parent')
    const learner = await call(google, 'GET', `/learning/children/${child.id}`)
    expect(learner.status).toBe(200)
    expect(learner.body.display_name).toBe('Meera')
    expect((await call(google, 'POST', '/signup', body)).status).toBe(403)
  })

  test('the new family is private', async () => {
    const google = await googleUser()
    const { body: created } = await call(google, 'POST', '/signup', body)
    const other = await makeUser('parent')
    expect((await call(other, 'GET', `/children/${created.child.id}`)).status).toBe(404)
    expect((await call(other, 'GET', `/learning/children/${created.child.id}`)).status).toBe(404)
  })

  test('an email already on Speechomania is refused', async () => {
    const email = `invited.${crypto.randomUUID().slice(0, 8)}@example.com`
    await db.users.create({ data: { email, full_name: 'Invited', role: 'parent' } })
    const google = await googleUser(email)
    expect((await call(google, 'POST', '/signup', body)).status).toBe(409)
  })
})

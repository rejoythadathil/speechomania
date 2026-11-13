import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  call,
  googleGuest,
  makeChild,
  makePublishedLesson,
  makeUser
} from '../../../../../test/helpers.js'

let admin, parent, guest, demo, privateChild, lesson

beforeAll(async () => {
  admin = await makeUser('admin')
  parent = await makeUser('parent')
  guest = await googleGuest()
  lesson = await makePublishedLesson(admin)
  demo = await makeChild(parent, admin, null)
  privateChild = await makeChild(parent, admin, null)
  await db.children.update({
    where: { id: demo.id },
    data: { metadata: { demo: true, guest: true }, assigned_lessons: [lesson.slug] }
  })
  await call(admin, 'PUT', `/children/${privateChild.id}/lessons`, { slugs: [lesson.slug] })
})

describe('guest', () => {
  test('needs a Google sign-in', async () => {
    expect((await call(null, 'GET', '/guest')).status).toBe(401)
    const outsider = await makeUser('parent')
    await db.users.delete({ where: { id: outsider.id } })
    expect((await call(outsider, 'GET', '/guest')).status).toBe(403)
  })

  test('invited accounts are not guests', async () => {
    expect((await call(parent, 'GET', '/guest')).status).toBe(403)
    expect((await call(admin, 'GET', '/guest')).status).toBe(403)
  })

  test('an unknown Google account still cannot use the member API', async () => {
    expect((await call(guest, 'GET', '/auth/me')).status).toBe(403)
    expect((await call(guest, 'GET', `/learning/children/${demo.id}`)).status).toBe(403)
  })

  test('gets the shared demo child', async () => {
    const { status, body } = await call(guest, 'GET', '/guest')
    expect(status).toBe(200)
    expect(Object.keys(body).sort()).toEqual(['display_name', 'id'])
    const stored = await db.children.findUnique({ where: { id: body.id } })
    expect(stored.metadata.guest).toBe(true)
  })

  test('reads the demo child learning view', async () => {
    const learner = await call(guest, 'GET', `/guest/learning/children/${demo.id}`)
    expect(learner.status).toBe(200)
    expect(learner.body.id).toBe(demo.id)
    const shelf = await call(guest, 'GET', `/guest/learning/children/${demo.id}/lessons`, null, {
      page: 1,
      page_size: 10
    })
    expect(shelf.status).toBe(200)
    expect(shelf.body.items.map((item) => item.slug)).toContain(lesson.slug)
    const played = await call(
      guest,
      'GET',
      `/guest/learning/children/${demo.id}/lessons/${lesson.id}`
    )
    expect(played.status).toBe(200)
  })

  test('cannot see any other child', async () => {
    expect((await call(guest, 'GET', `/guest/learning/children/${privateChild.id}`)).status).toBe(
      404
    )
    const lessons = await call(
      guest,
      'GET',
      `/guest/learning/children/${privateChild.id}/lessons/${lesson.id}`
    )
    expect(lessons.status).toBe(404)
  })

  test('cannot save anything', async () => {
    const before = await db.attempts.count({ where: { child_id: demo.id } })
    const start = await call(guest, 'POST', `/guest/learning/children/${demo.id}/attempts`, {
      lesson_id: lesson.id
    })
    expect(start.status).toBe(403)
    expect(await db.attempts.count({ where: { child_id: demo.id } })).toBe(before)
  })
})

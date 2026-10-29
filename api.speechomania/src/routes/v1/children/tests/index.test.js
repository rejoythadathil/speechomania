import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'

let admin, mentor, otherMentor, parent, otherParent, child

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
})

describe('children', () => {
  test('consent is required to add a child', async () => {
    const response = await call(parent, 'POST', '/children', { display_name: 'No consent' })
    expect(response.status).toBe(400)
    expect(response.body.error.details[0].field).toBe('consent_given')
  })

  test('a parent cannot add a child for another parent', async () => {
    expect((await call(parent, 'POST', '/children', { parent_id: otherParent.id, display_name: 'X', consent_given: true })).status).toBe(403)
  })

  test('each role only reaches the children it owns or is assigned', async () => {
    expect((await call(parent, 'GET', `/children/${child.id}`)).status).toBe(200)
    expect((await call(mentor, 'GET', `/children/${child.id}`)).status).toBe(200)
    expect((await call(admin, 'GET', `/children/${child.id}`)).status).toBe(200)
    expect((await call(otherParent, 'GET', `/children/${child.id}`)).status).toBe(404)
    expect((await call(otherMentor, 'GET', `/children/${child.id}`)).status).toBe(404)
    const list = await call(otherParent, 'GET', '/children')
    expect(list.body.items.find((item) => item.id === child.id)).toBeUndefined()
  })

  test('mentors cannot edit child profiles and parents cannot change status', async () => {
    expect((await call(mentor, 'PATCH', `/children/${child.id}`, { display_name: 'Renamed' })).status).toBe(403)
    expect((await call(parent, 'PATCH', `/children/${child.id}`, { status: 'archived' })).status).toBe(403)
    const updated = await call(parent, 'PATCH', `/children/${child.id}`, { sensory_settings: { sound: 'quiet' } })
    expect(updated.status).toBe(200)
    expect(updated.body.sensory_settings.sound).toBe('quiet')
  })

  test('reassigning a mentor moves access immediately', async () => {
    const moving = await makeChild(parent, admin, mentor)
    expect((await call(admin, 'PUT', `/children/${moving.id}/mentor`, { mentor_id: otherMentor.id })).status).toBe(200)
    expect((await call(mentor, 'GET', `/children/${moving.id}`)).status).toBe(404)
    expect((await call(otherMentor, 'GET', `/children/${moving.id}`)).status).toBe(200)
  })

  test('only an active mentor can be assigned', async () => {
    expect((await call(admin, 'PUT', `/children/${child.id}/mentor`, { mentor_id: parent.id })).status).toBe(400)
  })

  test('assigned lessons must be published', async () => {
    const lesson = await makePublishedLesson(admin)
    expect((await call(mentor, 'PUT', `/children/${child.id}/lessons`, { slugs: ['does-not-exist'] })).status).toBe(400)
    const assigned = await call(mentor, 'PUT', `/children/${child.id}/lessons`, { slugs: [lesson.slug] })
    expect(assigned.status).toBe(200)
    expect(assigned.body.assigned_lessons).toEqual([lesson.slug])
    expect((await call(otherMentor, 'PUT', `/children/${child.id}/lessons`, { slugs: [] })).status).toBe(404)
  })

  test('viewing a child is written to the audit log', async () => {
    await call(mentor, 'GET', `/children/${child.id}`)
    const log = await call(admin, 'GET', `/audit?entity_type=child&entity_id=${child.id}&action=child.viewed&actor_id=${mentor.id}`)
    expect(log.body.total).toBeGreaterThan(0)
  })
})

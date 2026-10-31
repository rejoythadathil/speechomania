import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeUser } from '../../../../../test/helpers.js'

let mentor, parent

beforeAll(async () => {
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
})

describe('own profile', () => {
  test('returns details and role stats', async () => {
    const { status, body } = await call(mentor, 'GET', '/auth/me')
    expect(status).toBe(200)
    expect(body).toMatchObject({ id: mentor.id, role: 'mentor' })
    expect(body.stats).toMatchObject({ children: 0, remarks: 0 })
  })

  test('staff can edit their own name and phone only', async () => {
    const { status, body } = await call(mentor, 'PATCH', '/auth/me', { full_name: 'Renamed Mentor', phone: '+91 98450 12345' })
    expect(status).toBe(200)
    expect(body).toMatchObject({ full_name: 'Renamed Mentor', phone: '+91 98450 12345', role: 'mentor' })
    expect((await call(mentor, 'PATCH', '/auth/me', { role: 'admin' })).status).toBe(400)
  })

  test('avatar defaults to the user id and can be changed', async () => {
    expect((await call(mentor, 'GET', '/auth/me')).body.avatar).toBe(mentor.id)
    const { body } = await call(mentor, 'PATCH', '/auth/me', { avatar: 'gaze-7' })
    expect(body.avatar).toBe('gaze-7')
    expect(body.full_name).toBe('Renamed Mentor')
    expect((await call(mentor, 'PATCH', '/auth/me', { avatar: '<svg>' })).status).toBe(400)
  })

  test('parents cannot edit through settings', async () => {
    expect((await call(parent, 'PATCH', '/auth/me', { full_name: 'X' })).status).toBe(403)
  })
})

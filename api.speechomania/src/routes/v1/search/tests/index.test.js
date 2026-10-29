import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makeUser } from '../../../../../test/helpers.js'

let admin, mentor, otherMentor, parent, otherParent, mine, theirs
const tag = `Zq${crypto.randomUUID().slice(0, 6)}`

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  mine = await makeChild(parent, admin, mentor)
  theirs = await makeChild(otherParent, admin, otherMentor)
  await call(admin, 'PATCH', `/children/${mine.id}`, { display_name: `${tag} Mine` })
  await call(admin, 'PATCH', `/children/${theirs.id}`, { display_name: `${tag} Theirs` })
})

const ids = (body, group) => (body.groups[group]?.items ?? []).map((item) => item.id)

describe('global search', () => {
  test('admins search children, lessons and people', async () => {
    const { status, body } = await call(admin, 'GET', '/search', undefined, { q: tag })
    expect(status).toBe(200)
    expect(ids(body, 'children')).toEqual(expect.arrayContaining([mine.id, theirs.id]))
    expect(Object.keys(body.groups).sort()).toEqual(['children', 'lessons', 'people'])
  })

  test('results respect each role\'s scope', async () => {
    const forMentor = await call(mentor, 'GET', '/search', undefined, { q: tag })
    expect(ids(forMentor.body, 'children')).toEqual([mine.id])
    expect(forMentor.body.groups.people).toBeUndefined()
    const forParent = await call(otherParent, 'GET', '/search', undefined, { q: tag })
    expect(ids(forParent.body, 'children')).toEqual([theirs.id])
    expect(Object.keys(forParent.body.groups)).toEqual(['children'])
  })

  test('people results never leak to non-admins and parent emails stay hidden', async () => {
    const { body } = await call(mentor, 'GET', '/search', undefined, { q: parent.email.slice(0, 12) })
    expect(body.groups.people).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain(parent.email)
  })

  test('an empty query is rejected', async () => {
    expect((await call(admin, 'GET', '/search', undefined, { q: '' })).status).toBe(400)
  })
})

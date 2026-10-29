import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'
import { starsFor, stepsTotal } from '../utils/index.js'

const line = (text) => ({ text })
const pickContent = {
  player: 'pick',
  contrast: 'can’t',
  lines: { intro: line('Let’s read together.'), quiz: line('Now, show me.') },
  steps: [
    { text: 'Who can’t swim?', choices: ['baby', 'swimmer'], answer: 'baby', actor: 'swimmer', act: 'swim', praise: line('Yes! The baby can’t swim.'), teach: line('The baby can’t swim. The swimmer can swim.') },
    { text: 'Who can’t fly?', choices: ['snake', 'bird'], answer: 'snake', actor: 'bird', act: 'fly', praise: line('Yes! The snake can’t fly.'), teach: line('The snake can’t fly. The bird can fly.') }
  ]
}

let admin, mentor, parent, otherParent, child, pick, story

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  const created = await call(admin, 'POST', '/lessons', { slug: `pick-${crypto.randomUUID().slice(0, 8)}`, title: 'Who can’t?', content: pickContent })
  pick = (await call(admin, 'POST', `/lessons/${created.body.id}/publish`)).body
  story = await makePublishedLesson(admin)
  await call(admin, 'PUT', `/children/${child.id}/lessons`, { slugs: [pick.slug] })
})

describe('pick lesson content', () => {
  test('an answer that is not one of the two pictures is rejected', async () => {
    const bad = structuredClone(pickContent)
    bad.steps[0].answer = 'lion'
    const { status } = await call(admin, 'POST', '/lessons', { slug: `bad-${crypto.randomUUID().slice(0, 8)}`, title: 'Bad', content: bad })
    expect(status).toBe(400)
  })

  test('a pick page without its praise and teach lines is rejected', async () => {
    const { status } = await call(admin, 'POST', '/lessons', { slug: `bare-${crypto.randomUUID().slice(0, 8)}`, title: 'Bare', content: { player: 'pick', steps: [{ text: 'Who?' }] } })
    expect(status).toBe(400)
  })
})

describe('learning scope', () => {
  test('a parent opens their own child', async () => {
    const { status, body } = await call(parent, 'GET', `/learning/children/${child.id}`)
    expect(status).toBe(200)
    expect(body).toMatchObject({ id: child.id, has_pin: false, stars: 0 })
    expect(body.pin_hash).toBeUndefined()
  })

  test('another parent gets 404 and staff get 403 on every learning route', async () => {
    const paths = [['GET', `/learning/children/${child.id}`], ['GET', `/learning/children/${child.id}/lessons`], ['GET', `/learning/children/${child.id}/lessons/${pick.id}`]]
    for (const [method, path] of paths) {
      expect((await call(otherParent, method, path)).status).toBe(404)
      expect((await call(mentor, method, path)).status).toBe(403)
      expect((await call(admin, method, path)).status).toBe(403)
    }
    expect((await call(otherParent, 'POST', `/learning/children/${child.id}/attempts`, { lesson_id: pick.id })).status).toBe(404)
  })

  test('the shelf lists only published lessons assigned to the child, paginated', async () => {
    const { status, body } = await call(parent, 'GET', `/learning/children/${child.id}/lessons`, undefined, { page: 1, page_size: 10 })
    expect(status).toBe(200)
    expect(body).toMatchObject({ page: 1, page_size: 10, total: 1, total_pages: 1 })
    expect(body.items[0]).toMatchObject({ id: pick.id, player: 'pick', step_count: 2, cover: ['baby', 'swimmer'], times_completed: 0 })
  })

  test('a lesson that is not assigned cannot be opened or started', async () => {
    expect((await call(parent, 'GET', `/learning/children/${child.id}/lessons/${story.id}`)).status).toBe(404)
    expect((await call(parent, 'POST', `/learning/children/${child.id}/attempts`, { lesson_id: story.id })).status).toBe(404)
  })

  test('an assigned lesson opens with learn and check pages counted', async () => {
    const { status, body } = await call(parent, 'GET', `/learning/children/${child.id}/lessons/${pick.id}`)
    expect(status).toBe(200)
    expect(body.steps_total).toBe(4)
    expect(body.content.steps[0]).toMatchObject({ answer: 'baby', actor: 'swimmer', act: 'swim' })
  })
})

describe('attempts', () => {
  test('stars come from first-try answers in the check pages, and a finished attempt is closed', async () => {
    const started = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, { lesson_id: pick.id })
    expect(started.status).toBe(201)
    expect(started.body).toMatchObject({ status: 'in_progress', steps_total: 4 })
    const id = started.body.id
    const event = (step, index, correct, wrongs = 0) => ({ step, index, correct, wrongs, latency_ms: 1200, choice: 'baby' })

    expect((await call(otherParent, 'PATCH', `/learning/attempts/${id}`, { events: [], steps_completed: 1 })).status).toBe(404)
    expect((await call(admin, 'PATCH', `/learning/attempts/${id}`, { events: [], steps_completed: 1 })).status).toBe(403)

    const half = await call(parent, 'PATCH', `/learning/attempts/${id}`, { events: [event('learn', 0, true, 1), event('learn', 1, true)], steps_completed: 2 })
    expect(half.body).toMatchObject({ status: 'in_progress', steps_completed: 2, stars: 0 })

    const done = await call(parent, 'PATCH', `/learning/attempts/${id}`, { events: [event('check', 0, true), event('check', 1, false)], steps_completed: 9, completed: true })
    expect(done.body).toMatchObject({ status: 'completed', steps_completed: 4, stars: 1 })

    expect((await call(parent, 'PATCH', `/learning/attempts/${id}`, { events: [], steps_completed: 4 })).status).toBe(409)
    expect((await call(parent, 'GET', `/learning/children/${child.id}`)).body.stars).toBe(1)
    const shelf = await call(parent, 'GET', `/learning/children/${child.id}/lessons`)
    expect(shelf.body.items[0]).toMatchObject({ times_completed: 1, best_stars: 1 })
  })
})

describe('leaving learning mode', () => {
  test('only the parent sets the PIN, and leaving checks it', async () => {
    expect((await call(admin, 'PATCH', `/children/${child.id}`, { pin: '1234' })).status).toBe(403)
    expect((await call(parent, 'POST', `/learning/children/${child.id}/exit`, {})).status).toBe(200)
    const set = await call(parent, 'PATCH', `/children/${child.id}`, { pin: '2468' })
    expect(set.status).toBe(200)
    expect(set.body.has_pin).toBe(true)
    expect(set.body.pin_hash).toBeUndefined()
    expect((await call(parent, 'POST', `/learning/children/${child.id}/exit`, { pin: '1111' })).status).toBe(400)
    expect((await call(parent, 'POST', `/learning/children/${child.id}/exit`, {})).status).toBe(400)
    expect((await call(parent, 'POST', `/learning/children/${child.id}/exit`, { pin: '2468' })).status).toBe(200)
    expect((await call(parent, 'PATCH', `/children/${child.id}`, { pin: '12' })).status).toBe(400)
    expect((await call(parent, 'PATCH', `/children/${child.id}`, { pin: null })).body.has_pin).toBe(false)
  })
})

describe('learning rules', () => {
  test('a pick lesson has a learn and a check page per step', () => {
    expect(stepsTotal({ player: 'pick', steps: [{}, {}, {}] })).toBe(6)
    expect(stepsTotal({ player: 'story', steps: [{}, {}] })).toBe(2)
    expect(stepsTotal({})).toBe(0)
  })

  test('stars count first-try check answers, and a story earns one', () => {
    const event = (step, correct, wrongs = 0) => ({ step, correct, wrongs })
    expect(starsFor([event('learn', true), event('check', true), event('check', true, 1), event('check', false)])).toBe(1)
    expect(starsFor([event('story', true)])).toBe(1)
  })
})

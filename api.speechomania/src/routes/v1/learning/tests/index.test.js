import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  call,
  makeChild,
  makePublishedLesson,
  makeUser,
  publishFixture
} from '../../../../../test/helpers.js'
import {
  badgeStars,
  bestBySlug,
  lockedAfter,
  friendsFor,
  maxStars,
  newFriend,
  prizeOf,
  rewardOf,
  starsFor,
  stepsTotal
} from '../utils/index.js'

const line = (text) => ({ text })
const pickContent = {
  player: 'pick',
  contrast: 'can’t',
  lines: { intro: line('Let’s read together.'), quiz: line('Now, show me.') },
  steps: [
    {
      text: 'Who can’t swim?',
      choices: ['baby', 'swimmer'],
      answer: 'baby',
      actor: 'swimmer',
      act: 'swim',
      praise: line('Yes! The baby can’t swim.'),
      teach: line('The baby can’t swim. The swimmer can swim.')
    },
    {
      text: 'Who can’t fly?',
      choices: ['snake', 'bird'],
      answer: 'snake',
      actor: 'bird',
      act: 'fly',
      praise: line('Yes! The snake can’t fly.'),
      teach: line('The snake can’t fly. The bird can fly.')
    }
  ]
}

const sharkContent = {
  player: 'shark',
  rounds: 2,
  steps: ['eating', 'running', 'jumping'].map((word) => ({
    text: `Feed me ${word}!`,
    word,
    image_key: `lessons/test/${word}.jpg`
  }))
}

let admin, mentor, parent, otherParent, child, pick, story, shark

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  const created = await call(admin, 'POST', '/lessons', {
    slug: `pick-${crypto.randomUUID().slice(0, 8)}`,
    title: 'Who can’t?',
    content: pickContent
  })
  pick = await publishFixture(admin, created.body.id)
  story = await makePublishedLesson(admin)
  const game = await call(admin, 'POST', '/lessons', {
    slug: `shark-${crypto.randomUUID().slice(0, 8)}`,
    title: 'Feed the shark',
    content: sharkContent
  })
  shark = await publishFixture(admin, game.body.id)
  await call(admin, 'PUT', `/children/${child.id}/lessons`, { slugs: [pick.slug] })
})

describe('pick lesson content', () => {
  test('an answer that is not one of the two pictures is rejected', async () => {
    const bad = structuredClone(pickContent)
    bad.steps[0].answer = 'lion'
    const { status } = await call(admin, 'POST', '/lessons', {
      slug: `bad-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Bad',
      content: bad
    })
    expect(status).toBe(400)
  })

  test('a pick page without its praise and teach lines is rejected', async () => {
    const { status } = await call(admin, 'POST', '/lessons', {
      slug: `bare-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Bare',
      content: { player: 'pick', steps: [{ text: 'Who?' }] }
    })
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
    const paths = [
      ['GET', `/learning/children/${child.id}`],
      ['GET', `/learning/children/${child.id}/lessons`],
      ['GET', `/learning/children/${child.id}/lessons/${pick.id}`]
    ]
    for (const [method, path] of paths) {
      expect((await call(otherParent, method, path)).status).toBe(404)
      expect((await call(mentor, method, path)).status).toBe(403)
      expect((await call(admin, method, path)).status).toBe(403)
    }
    expect(
      (
        await call(otherParent, 'POST', `/learning/children/${child.id}/attempts`, {
          lesson_id: pick.id
        })
      ).status
    ).toBe(404)
  })

  test('the shelf lists only published lessons assigned to the child, paginated', async () => {
    const { status, body } = await call(
      parent,
      'GET',
      `/learning/children/${child.id}/lessons`,
      undefined,
      { page: 1, page_size: 10 }
    )
    expect(status).toBe(200)
    expect(body).toMatchObject({ page: 1, page_size: 10, total: 1, total_pages: 1 })
    expect(body.items[0]).toMatchObject({
      id: pick.id,
      player: 'pick',
      step_count: 2,
      cover: ['baby', 'swimmer'],
      times_completed: 0
    })
  })

  test('a lesson that is not assigned cannot be opened or started', async () => {
    expect(
      (await call(parent, 'GET', `/learning/children/${child.id}/lessons/${story.id}`)).status
    ).toBe(404)
    expect(
      (
        await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
          lesson_id: story.id
        })
      ).status
    ).toBe(404)
  })

  test('an assigned game lesson opens with one question page per step and no cards', async () => {
    const { status, body } = await call(
      parent,
      'GET',
      `/learning/children/${child.id}/lessons/${pick.id}`
    )
    expect(status).toBe(200)
    expect(body.steps_total).toBe(2)
    expect(body.content.steps[0]).toMatchObject({ answer: 'baby', actor: 'swimmer', act: 'swim' })
    expect(body.cards).toEqual([])
    expect(body.check).toBeNull()
    expect(body.metadata).toBeUndefined()
  })
})

describe('game lessons', () => {
  const create = (content) =>
    call(admin, 'POST', '/lessons', {
      slug: `game-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Game',
      content
    })

  test('each game checks its own step shape', async () => {
    expect((await create({ player: 'shark', steps: sharkContent.steps.slice(0, 2) })).status).toBe(
      400
    )
    expect(
      (
        await create({
          player: 'shark',
          steps: sharkContent.steps.map(({ text, word }) => ({ text, word }))
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'compare',
          steps: [{ text: 'Who is taller?', choices: ['giraffe', 'boy'], answer: 'tree' }]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'yesno',
          steps: [{ text: 'Is this a dog?', image_key: 'lessons/test/dog.jpg', answer: 'yes' }]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'train',
          rounds: 41,
          steps: [{ text: 'I see … dog.', choices: ['a', 'the'], answer: 'a' }]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'yesno',
          steps: [
            {
              text: 'Is this a dog?',
              image_key: 'lessons/test/dog.jpg',
              answer: false,
              sentence: line('No. This is a cat.')
            }
          ]
        })
      ).status
    ).toBe(201)
    expect(
      (
        await create({
          player: 'squish',
          rounds: 1,
          steps: [
            {
              text: 'Squish do not.',
              first: 'do',
              second: 'not',
              choices: ['don’t', 'won’t'],
              answer: 'don’t'
            }
          ]
        })
      ).status
    ).toBe(201)
    expect(
      (
        await create({
          player: 'shark',
          steps: ['run', 'swim', 'sing'].map((word) => ({
            text: `Feed me ${word}!`,
            word,
            art: [word]
          }))
        })
      ).status
    ).toBe(201)
    expect(
      (
        await create({
          player: 'shark',
          steps: [
            { text: 'Feed me!', word: 'run', art: ['Not An Art'] },
            { text: 'a', word: 'b', art: ['b'] },
            { text: 'c', word: 'd', art: ['d'] }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'compare',
          steps: [
            {
              text: 'Who is taller?',
              choices: ['giraffe', 'boy'],
              art: ['giraffe'],
              answer: 'giraffe'
            }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'compare',
          steps: [
            {
              text: 'Who is taller?',
              choices: ['giraffe', 'boy'],
              art: ['giraffe', 'boy'],
              answer: 'giraffe'
            }
          ]
        })
      ).status
    ).toBe(201)
    expect(
      (
        await create({
          player: 'place',
          steps: [
            { text: 'Put the cat in the box.', choices: ['in', 'on'], art: ['cat'], answer: 'in' }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'place',
          steps: [
            {
              text: 'Put the cat in the box.',
              choices: ['in', 'on'],
              art: ['cat', 'box'],
              answer: 'in'
            }
          ]
        })
      ).status
    ).toBe(201)
    const pair = (first, second) => ({
      text: `${first} and ${second}.`,
      first,
      second,
      art: [first, second]
    })
    expect(
      (await create({ player: 'match', steps: [pair('hot', 'cold'), pair('up', 'down')] })).status
    ).toBe(400)
    expect(
      (
        await create({
          player: 'match',
          steps: [pair('hot', 'cold'), pair('up', 'down'), pair('big', 'small')]
        })
      ).status
    ).toBe(201)
  })

  test('a game opens with signed picture links and plays its rounds, and the shelf hides storage keys', async () => {
    await call(admin, 'PUT', `/children/${child.id}/lessons`, { slugs: [pick.slug, shark.slug] })
    const { status, body } = await call(
      parent,
      'GET',
      `/learning/children/${child.id}/lessons/${shark.id}`
    )
    expect(status).toBe(200)
    expect(body.steps_total).toBe(2)
    expect(body.content.steps.every((step) => 'image_url' in step)).toBe(true)
    const shelf = await call(parent, 'GET', `/learning/children/${child.id}/lessons`)
    const item = shelf.body.items.find((lesson) => lesson.id === shark.id)
    expect(item).toMatchObject({ player: 'shark', max_stars: 2, cover: null })
    expect('cover_url' in item).toBe(true)
    expect(item.cover_key).toBeUndefined()
    expect(
      (await call(otherParent, 'GET', `/learning/children/${child.id}/lessons/${shark.id}`)).status
    ).toBe(404)

    const started = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      lesson_id: shark.id
    })
    const play = (index, correct, wrongs = 0) => ({
      step: 'play',
      index,
      correct,
      wrongs,
      latency_ms: 900,
      choice: 'running'
    })
    const done = await call(parent, 'PATCH', `/learning/attempts/${started.body.id}`, {
      events: [play(0, true), play(2, true, 1)],
      steps_completed: 2,
      completed: true
    })
    expect(done.body).toMatchObject({ status: 'completed', steps_completed: 2, stars: 1 })
    await call(admin, 'PUT', `/children/${child.id}/lessons`, { slugs: [pick.slug] })
  })
})

describe('attempts', () => {
  test('stars come from first-try answers in the check pages, and a finished attempt is closed', async () => {
    const before = (await call(parent, 'GET', `/learning/children/${child.id}`)).body.stars
    const started = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      lesson_id: pick.id
    })
    expect(started.status).toBe(201)
    expect(started.body).toMatchObject({ status: 'in_progress', steps_total: 2 })
    const id = started.body.id
    const event = (step, index, correct, wrongs = 0) => ({
      step,
      index,
      correct,
      wrongs,
      latency_ms: 1200,
      choice: 'baby'
    })

    expect(
      (
        await call(otherParent, 'PATCH', `/learning/attempts/${id}`, {
          events: [],
          steps_completed: 1
        })
      ).status
    ).toBe(404)
    expect(
      (await call(admin, 'PATCH', `/learning/attempts/${id}`, { events: [], steps_completed: 1 }))
        .status
    ).toBe(403)

    const half = await call(parent, 'PATCH', `/learning/attempts/${id}`, {
      events: [event('learn', 0, true, 1), event('learn', 1, true)],
      steps_completed: 2
    })
    expect(half.body).toMatchObject({ status: 'in_progress', steps_completed: 2, stars: 0 })

    const done = await call(parent, 'PATCH', `/learning/attempts/${id}`, {
      events: [
        event('check', 0, true),
        event('check', 1, false),
        event('quiz', 1, true),
        event('quiz', 0, false)
      ],
      steps_completed: 9,
      completed: true
    })
    expect(done.body).toMatchObject({ status: 'completed', steps_completed: 2, stars: 1 })
    const stored = await db.attempts.findUnique({ where: { id }, select: { metadata: true } })
    expect(stored.metadata.check).toEqual({ right: 1, total: 2 })

    expect(
      (await call(parent, 'PATCH', `/learning/attempts/${id}`, { events: [], steps_completed: 4 }))
        .status
    ).toBe(409)
    expect((await call(parent, 'GET', `/learning/children/${child.id}`)).body.stars).toBe(
      before + 1
    )
    const shelf = await call(parent, 'GET', `/learning/children/${child.id}/lessons`)
    expect(shelf.body.items[0]).toMatchObject({ times_completed: 1, best_stars: 1 })
  })
})

describe('badges', () => {
  test('a game finished with nearly every star earns a badge, and the learner counts games played', async () => {
    const before = (await call(parent, 'GET', `/learning/children/${child.id}`)).body
    expect(before).toMatchObject({ games_total: 1, games_played: 1 })
    expect(before.badges).toEqual([])
    const started = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      lesson_id: pick.id
    })
    const check = (index) => ({ step: 'check', index, correct: true, wrongs: 0, latency_ms: 800 })
    const finished = await call(parent, 'PATCH', `/learning/attempts/${started.body.id}`, {
      events: [check(0), check(1)],
      steps_completed: 2,
      completed: true
    })
    expect(finished.body.reward).toEqual({ new_best: true, new_badge: true, new_friend: null })
    const again = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      lesson_id: pick.id
    })
    const repeat = await call(parent, 'PATCH', `/learning/attempts/${again.body.id}`, {
      events: [check(0), check(1)],
      steps_completed: 2,
      completed: true
    })
    expect(repeat.body.reward).toEqual({ new_best: false, new_badge: false, new_friend: null })
    const after = (await call(parent, 'GET', `/learning/children/${child.id}`)).body
    expect(after.trophies).toEqual([
      {
        slug: pick.slug,
        title: 'Who can’t?',
        player: 'pick',
        cover: ['baby', 'swimmer'],
        prize: 'trophy'
      }
    ])
    expect(after.friends).toMatchObject({ earned: [], next: 'lion', total: 20 })
    expect(after.badges).toEqual([
      { slug: pick.slug, title: 'Who can’t?', player: 'pick', cover: ['baby', 'swimmer'] }
    ])
    expect((await call(otherParent, 'GET', `/learning/children/${child.id}`)).status).toBe(404)
  })
})

describe('parts', () => {
  test('part 2 stays locked until part 1 is finished, and only for the child’s own parts', async () => {
    const first = await makePublishedLesson(admin)
    const created = await call(admin, 'POST', '/lessons', {
      slug: `part-two-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Part two',
      content: {
        after: first.slug,
        steps: Array.from({ length: 15 }, (_, index) => ({ text: `Step ${index + 1}` }))
      }
    })
    expect(created.status).toBe(201)
    const second = await publishFixture(admin, created.body.id)
    const learner = await makeChild(parent, admin, mentor)
    const shelf = async () =>
      (
        await call(parent, 'GET', `/learning/children/${learner.id}/lessons`, undefined, {
          page: 1,
          page_size: 10
        })
      ).body.items.find((item) => item.id === second.id)
    const start = (lesson) =>
      call(parent, 'POST', `/learning/children/${learner.id}/attempts`, { lesson_id: lesson.id })

    await call(admin, 'PUT', `/children/${learner.id}/lessons`, { slugs: [second.slug] })
    expect((await shelf()).locked_after).toBeNull()
    expect((await start(second)).status).toBe(201)

    await call(admin, 'PUT', `/children/${learner.id}/lessons`, {
      slugs: [first.slug, second.slug]
    })
    expect((await shelf()).locked_after).toEqual({ slug: first.slug, title: 'Test lesson' })
    expect((await start(second)).status).toBe(403)
    expect(
      (
        await call(otherParent, 'POST', `/learning/children/${learner.id}/attempts`, {
          lesson_id: second.id
        })
      ).status
    ).toBe(404)

    const begun = await start(first)
    await call(parent, 'PATCH', `/learning/attempts/${begun.body.id}`, {
      events: [],
      steps_completed: 15,
      completed: true
    })
    expect((await shelf()).locked_after).toBeNull()
    expect((await start(second)).status).toBe(201)
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
    expect(
      (await call(parent, 'POST', `/learning/children/${child.id}/exit`, { pin: '1111' })).status
    ).toBe(400)
    expect((await call(parent, 'POST', `/learning/children/${child.id}/exit`, {})).status).toBe(400)
    expect(
      (await call(parent, 'POST', `/learning/children/${child.id}/exit`, { pin: '2468' })).status
    ).toBe(200)
    expect((await call(parent, 'PATCH', `/children/${child.id}`, { pin: '12' })).status).toBe(400)
    expect((await call(parent, 'PATCH', `/children/${child.id}`, { pin: null })).body.has_pin).toBe(
      false
    )
  })
})

describe('learning rules', () => {
  test('a pick lesson has one question page per step', () => {
    expect(stepsTotal({ player: 'pick', steps: [{}, {}, {}] })).toBe(3)
    expect(stepsTotal({ player: 'story', steps: [{}, {}] })).toBe(2)
    expect(stepsTotal({})).toBe(0)
  })

  test('a badge needs nine tenths of the stars, at least one', () => {
    expect(badgeStars(10)).toBe(9)
    expect(badgeStars(2)).toBe(2)
    expect(badgeStars(1)).toBe(1)
    expect(badgeStars(0)).toBe(1)
  })

  test('a game plays its rounds, never more than its steps', () => {
    expect(stepsTotal({ player: 'shark', rounds: 2, steps: [{}, {}, {}] })).toBe(2)
    expect(stepsTotal({ player: 'why', rounds: 8, steps: [{}, {}, {}] })).toBe(3)
    expect(stepsTotal({ player: 'compare', steps: [{}, {}] })).toBe(2)
    expect(stepsTotal({ player: 'match', steps: [{}, {}, {}, {}, {}, {}, {}] })).toBe(2)
    expect(stepsTotal({ player: 'match', rounds: 1, steps: [{}, {}, {}, {}, {}, {}] })).toBe(1)
  })

  test('stars count first-try check answers, and a story earns one', () => {
    const event = (step, correct, wrongs = 0) => ({ step, correct, wrongs })
    expect(
      starsFor([
        event('learn', true),
        event('check', true),
        event('check', true, 1),
        event('check', false)
      ])
    ).toBe(1)
    expect(starsFor([event('story', true)])).toBe(1)
    expect(
      starsFor([
        event('play', true),
        event('play', true),
        event('play', true, 2),
        event('play', false)
      ])
    ).toBe(2)
  })
})

describe('scoring rules', () => {
  test('prizeOf gives a trophy, medal or star by the best share, nothing before a play', () => {
    expect(prizeOf(null, 10)).toBeNull()
    expect(prizeOf(9, 10)).toBe('trophy')
    expect(prizeOf(6, 10)).toBe('medal')
    expect(prizeOf(0, 10)).toBe('star')
  })

  test('a new animal friend joins every 25 stars, in order, until the book is full', () => {
    expect(friendsFor(0)).toEqual({ earned: [], next: 'lion', stars_to_next: 25, total: 20 })
    expect(friendsFor(52)).toMatchObject({
      earned: ['lion', 'rabbit'],
      next: 'panda',
      stars_to_next: 23
    })
    expect(friendsFor(10000)).toMatchObject({ next: null, stars_to_next: 0 })
    expect(friendsFor(10000).earned).toHaveLength(20)
    expect(newFriend(20, 4)).toBeNull()
    expect(newFriend(20, 5)).toBe('lion')
    expect(newFriend(49, 2)).toBe('rabbit')
  })

  test('rewardOf marks a better score and the first time a badge is reached', () => {
    const first = { times: 0, best: 0 }
    expect(rewardOf(3, first, 10)).toEqual({ new_best: false, new_badge: false })
    expect(rewardOf(9, first, 10)).toEqual({ new_best: false, new_badge: true })
    expect(rewardOf(7, { times: 2, best: 5 }, 10)).toEqual({ new_best: true, new_badge: false })
    expect(rewardOf(10, { times: 2, best: 9 }, 10)).toEqual({ new_best: true, new_badge: false })
    expect(rewardOf(9, { times: 1, best: 9 }, 10)).toEqual({ new_best: false, new_badge: false })
  })

  test('lockedAfter locks only an assigned, unfinished earlier part, never a game already played', () => {
    const best = new Map([['done', { times: 1, stars: 2 }]])
    expect(lockedAfter({}, ['one'], best)).toBeNull()
    expect(lockedAfter({ after: 'one' }, ['two'], best)).toBeNull()
    expect(lockedAfter({ after: 'one' }, ['one'], best)).toBe('one')
    expect(lockedAfter({ after: 'done' }, ['done'], best)).toBeNull()
    expect(lockedAfter({ after: 'one' }, ['one'], best, 'done')).toBeNull()
  })

  test('maxStars follows each game', () => {
    const steps = (count) => Array.from({ length: count }, () => ({}))
    expect(maxStars({ steps: steps(4) })).toBe(1)
    expect(maxStars({ player: 'pick', steps: steps(3) })).toBe(3)
    expect(maxStars({ player: 'match', steps: steps(7) })).toBe(2)
    expect(maxStars({ player: 'shark', steps: steps(8), rounds: 5 })).toBe(5)
    expect(maxStars({ player: 'shark', steps: steps(3), rounds: 5 })).toBe(3)
  })

  test('bestBySlug joins versions of the same lesson', () => {
    const groups = [
      { lesson_id: 'a', _count: { _all: 2 }, _max: { stars: 3 } },
      { lesson_id: 'b', _count: { _all: 1 }, _max: { stars: 5 } }
    ]
    expect(
      bestBySlug(
        groups,
        new Map([
          ['a', 'Feelings'],
          ['b', 'feelings']
        ])
      ).get('feelings')
    ).toEqual({ times: 3, stars: 5 })
  })
})

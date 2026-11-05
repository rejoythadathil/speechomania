import { beforeAll, describe, expect, test } from 'bun:test'
import { call, makeChild, makeUser, publishFixture } from '../../../../../test/helpers.js'
import { DEFAULT_SETTINGS } from '../constants/index.js'
import {
  keepCollected,
  questionStats,
  scoreAttempt,
  snapshotItem,
  withDefaults
} from '../utils/index.js'

const yesNo = {
  player: 'yesno',
  lines: { retry: { text: 'Look again.' }, yes: { text: 'Yes!' } },
  steps: [
    { text: 'Is this a dog?', art: ['dog'], answer: true },
    { text: 'Is this a cat?', art: ['dog'], answer: false },
    { text: 'Is this a frog?', art: ['frog'], answer: true }
  ]
}

async function publishedLesson(admin, content) {
  const slug = `quiz-${crypto.randomUUID().slice(0, 8)}`
  const { body } = await call(admin, 'POST', '/lessons', { slug, title: 'Quiz source', content })
  await publishFixture(admin, body.id)
  return body
}

describe('assessment rules', () => {
  const settings = withDefaults({
    scoring: { points: 2, tries: 2, retry_points: 1, pass_percent: 50 }
  })
  const items = [
    { step: { text: 'a' } },
    { step: { text: 'b' }, points: 4 },
    { step: { text: 'c' } }
  ]

  test('defaults fill every group', () => {
    expect(withDefaults({ play: { hints: true } }).play).toEqual({
      ...DEFAULT_SETTINGS.play,
      hints: true
    })
    expect(withDefaults().collect).toEqual(DEFAULT_SETTINGS.collect)
  })

  test('only single questions from scoreable games are copied', () => {
    const lesson = {
      id: 'l',
      slug: 's',
      version: 2,
      title: 'T',
      content: { player: 'shark', steps: [{ word: 'a' }, { word: 'b' }, { word: 'c' }] }
    }
    expect(snapshotItem(lesson, 0, 3)).toMatchObject({
      player: 'shark',
      step: { word: 'a' },
      context: [{ word: 'b' }, { word: 'c' }],
      points: 3,
      lesson_version: 2
    })
    expect(snapshotItem({ ...lesson, content: { steps: [{ text: 'x' }] } }, 0)).toBeNull()
    expect(
      snapshotItem({ ...lesson, content: { player: 'match', steps: [{}, {}, {}] } }, 0)
    ).toBeNull()
    expect(snapshotItem(lesson, 9)).toBeNull()
  })

  test('first try earns full points, a later try earns retry points within the allowed tries', () => {
    const events = [
      { step: 'assess', index: 0, correct: true, wrongs: 0 },
      { step: 'assess', index: 1, correct: true, wrongs: 1 },
      { step: 'assess', index: 2, correct: true, wrongs: 2 }
    ]
    expect(scoreAttempt(events, items, settings)).toEqual({
      score: 3,
      max_score: 8,
      percent: 38,
      answered: 3,
      passed: false
    })
    expect(
      scoreAttempt([{ step: 'assess', index: 1, correct: true, wrongs: 0 }], items, settings)
    ).toMatchObject({ score: 4, percent: 50, passed: true })
    expect(scoreAttempt([], items, withDefaults()).passed).toBeNull()
  })

  test('switched-off data points are dropped', () => {
    const event = {
      step: 'assess',
      index: 0,
      correct: true,
      wrongs: 1,
      choice: 'yes',
      latency_ms: 900
    }
    expect(
      keepCollected(event, withDefaults({ collect: { answers: false, time: false, tries: false } }))
    ).toEqual({ step: 'assess', index: 0, correct: true })
    expect(keepCollected(event, withDefaults())).toEqual(event)
  })

  test('question accuracy counts right-first-try answers', () => {
    const attempts = [
      { events: [{ step: 'assess', index: 0, correct: true, wrongs: 0 }] },
      { events: [{ step: 'assess', index: 0, correct: true, wrongs: 1 }] }
    ]
    expect(questionStats(items, attempts)[0]).toMatchObject({
      answered: 2,
      right_first_try: 1,
      accuracy: 50
    })
    expect(questionStats(items, attempts)[1].accuracy).toBeNull()
  })
})

describe('assessments', () => {
  let admin, mentor, otherMentor, parent, otherParent, child, otherChild, lesson, storyLesson

  beforeAll(async () => {
    admin = await makeUser('admin')
    mentor = await makeUser('mentor')
    otherMentor = await makeUser('mentor')
    parent = await makeUser('parent')
    otherParent = await makeUser('parent')
    child = await makeChild(parent, admin, mentor)
    otherChild = await makeChild(otherParent, admin, otherMentor)
    lesson = await publishedLesson(admin, yesNo)
    storyLesson = await publishedLesson(admin, { steps: [{ text: 'Once upon a time.' }] })
  })

  const build = (settings = {}) =>
    call(admin, 'POST', '/assessments', {
      title: 'Check-in',
      settings,
      items: [
        { lesson_id: lesson.id, step_index: 0 },
        { lesson_id: lesson.id, step_index: 1, points: 2 }
      ]
    })

  test('only admins build; stories cannot be questions; drafts stay with admins', async () => {
    expect((await call(mentor, 'POST', '/assessments', { title: 'X' })).status).toBe(403)
    expect(
      (
        await call(admin, 'POST', '/assessments', {
          title: 'X',
          items: [{ lesson_id: storyLesson.id, step_index: 0 }]
        })
      ).status
    ).toBe(400)
    const draft = await build()
    expect(draft.status).toBe(201)
    expect(draft.body).toMatchObject({ status: 'draft', question_count: 2, max_score: 3 })
    expect((await call(mentor, 'GET', `/assessments/${draft.body.id}`)).status).toBe(404)
    expect((await call(parent, 'GET', '/assessments')).status).toBe(403)
    expect(
      (
        await call(admin, 'POST', `/assessments/${draft.body.id}/assignments`, {
          child_ids: [child.id]
        })
      ).status
    ).toBe(409)
  })

  test('mentors assign only their own children and see only their results', async () => {
    const { body } = await build()
    await call(admin, 'POST', `/assessments/${body.id}/publish`)
    expect(
      (
        await call(mentor, 'POST', `/assessments/${body.id}/assignments`, {
          child_ids: [otherChild.id]
        })
      ).status
    ).toBe(404)
    expect(
      (
        await call(mentor, 'POST', `/assessments/${body.id}/assignments`, {
          child_ids: [child.id],
          due_on: '2026-12-01'
        })
      ).status
    ).toBe(200)
    await call(otherMentor, 'POST', `/assessments/${body.id}/assignments`, {
      child_ids: [otherChild.id]
    })
    const mine = await call(mentor, 'GET', `/assessments/${body.id}/results`)
    expect(mine.body.items.map((row) => row.child_id)).toEqual([child.id])
    expect(mine.body.items[0]).toMatchObject({ status: 'not_started', due_on: '2026-12-01' })
    expect((await call(admin, 'GET', `/assessments/${body.id}/results`)).body.total).toBe(2)
    const list = await call(mentor, 'GET', '/assessments', undefined, { q: 'Check-in' })
    expect(list.body.items.find((row) => row.id === body.id)).toMatchObject({
      assigned: 1,
      completed: 0
    })
  })

  test('a child plays it, the score is kept, and parents see it unless hidden', async () => {
    const { body } = await build({
      collect: { answers: false, time: true, tries: true },
      play: { retakes: false }
    })
    await call(admin, 'POST', `/assessments/${body.id}/publish`)
    await call(mentor, 'POST', `/assessments/${body.id}/assignments`, { child_ids: [child.id] })
    const shelf = await call(parent, 'GET', `/learning/children/${child.id}/assessments`)
    expect(shelf.body.items.find((item) => item.id === body.id)).toMatchObject({
      can_start: true,
      done: false,
      question_count: 2
    })
    expect(
      (await call(otherParent, 'GET', `/learning/children/${child.id}/assessments`)).status
    ).toBe(404)
    const playable = await call(
      parent,
      'GET',
      `/learning/children/${child.id}/assessments/${body.id}`
    )
    expect(playable.body.items).toHaveLength(2)
    const attempt = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      assessment_id: body.id
    })
    expect(attempt.status).toBe(201)
    const done = await call(parent, 'PATCH', `/learning/attempts/${attempt.body.id}`, {
      events: [
        { step: 'assess', index: 0, correct: true, wrongs: 0, choice: 'yes', latency_ms: 800 },
        { step: 'assess', index: 1, correct: false, wrongs: 1, choice: 'yes', latency_ms: 900 }
      ],
      steps_completed: 2,
      completed: true
    })
    expect(done.body).toMatchObject({
      status: 'completed',
      stars: 0,
      result: { score: 1, max_score: 3, percent: 33 }
    })
    expect(
      (
        await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
          assessment_id: body.id
        })
      ).status
    ).toBe(409)
    const detail = await call(mentor, 'GET', `/assessment-attempts/${attempt.body.id}`)
    expect(detail.body.questions[0].response).toEqual({
      step: 'assess',
      index: 0,
      correct: true,
      wrongs: 0,
      latency_ms: 800,
      points: 1
    })
    expect((await call(otherMentor, 'GET', `/assessment-attempts/${attempt.body.id}`)).status).toBe(
      404
    )
    const forParent = await call(parent, 'GET', `/children/${child.id}/assessments`)
    expect(forParent.body.items.find((row) => row.assessment_id === body.id).latest).toMatchObject({
      score: 1,
      percent: 33
    })
    const summary = await call(mentor, 'GET', `/assessments/${body.id}/summary`)
    expect(summary.body).toMatchObject({ assigned: 1, completed: 1, average_percent: 33 })
    expect(summary.body.questions.map((question) => question.accuracy)).toEqual([100, 0])
    expect((await call(parent, 'GET', `/children/${otherChild.id}/assessments`)).status).toBe(404)
  })

  test('a hidden score stays hidden from parents', async () => {
    const { body } = await build({ visibility: { parent_score: false, child_score: false } })
    await call(admin, 'POST', `/assessments/${body.id}/publish`)
    await call(admin, 'POST', `/assessments/${body.id}/assignments`, { child_ids: [child.id] })
    const attempt = await call(parent, 'POST', `/learning/children/${child.id}/attempts`, {
      assessment_id: body.id
    })
    const done = await call(parent, 'PATCH', `/learning/attempts/${attempt.body.id}`, {
      events: [{ step: 'assess', index: 0, correct: true, wrongs: 0, latency_ms: 500 }],
      steps_completed: 2,
      completed: true
    })
    expect(done.body.result).toBeUndefined()
    const row = (await call(parent, 'GET', `/children/${child.id}/assessments`)).body.items.find(
      (item) => item.assessment_id === body.id
    )
    expect(row).toMatchObject({ score_hidden: true, status: 'completed' })
    expect(row.latest.score).toBeUndefined()
    expect(
      (await call(parent, 'GET', `/assessment-attempts/${attempt.body.id}`)).body
    ).toMatchObject({ result: null, score_hidden: true })
    expect(
      (await call(mentor, 'GET', `/assessment-attempts/${attempt.body.id}`)).body.result
    ).toMatchObject({ score: 1 })
  })

  test('drafts are edited and deleted; published ones are archived and can no longer be assigned', async () => {
    const { body } = await build()
    const edited = await call(admin, 'PATCH', `/assessments/${body.id}`, {
      title: 'Renamed',
      items: [{ lesson_id: lesson.id, step_index: 2 }]
    })
    expect(edited.body).toMatchObject({ title: 'Renamed', question_count: 1 })
    await call(admin, 'POST', `/assessments/${body.id}/publish`)
    expect((await call(admin, 'PATCH', `/assessments/${body.id}`, { title: 'Again' })).status).toBe(
      409
    )
    expect((await call(admin, 'DELETE', `/assessments/${body.id}`)).status).toBe(204)
    expect((await call(admin, 'GET', `/assessments/${body.id}`)).body.status).toBe('archived')
    expect(
      (await call(admin, 'POST', `/assessments/${body.id}/assignments`, { child_ids: [child.id] }))
        .status
    ).toBe(409)
    const draft = await build()
    expect((await call(admin, 'DELETE', `/assessments/${draft.body.id}`)).status).toBe(204)
    expect((await call(admin, 'GET', `/assessments/${draft.body.id}`)).status).toBe(404)
  })
})

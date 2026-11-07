import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'
import { learnCards, versionSummary } from '../utils/index.js'

let admin, mentor, parent

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
})

describe('lessons', () => {
  test('only admins create lessons; drafts are hidden from others', async () => {
    expect(
      (await call(mentor, 'POST', '/lessons', { slug: 'mentor-lesson', title: 'X' })).status
    ).toBe(403)
    const draft = await call(admin, 'POST', '/lessons', {
      slug: `draft-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Draft'
    })
    expect(draft.status).toBe(201)
    expect(draft.body.status).toBe('draft')
    expect((await call(parent, 'GET', `/lessons/${draft.body.id}`)).status).toBe(404)
    expect((await call(admin, 'POST', `/lessons/${draft.body.id}/publish`)).status).toBe(400)
  })

  test('a lesson needs at least 15 activities to publish', async () => {
    const draft = await call(admin, 'POST', '/lessons', {
      slug: `short-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Short',
      content: { steps: Array.from({ length: 14 }, (_, index) => ({ text: `Page ${index}` })) }
    })
    const refused = await call(admin, 'POST', `/lessons/${draft.body.id}/publish`)
    expect(refused.status).toBe(400)
    expect(refused.body.error.message).toContain('at least 15 activities')
  })

  test('publishing a new version supersedes the old one', async () => {
    const v1 = await makePublishedLesson(admin)
    expect(
      (await call(admin, 'PATCH', `/lessons/${v1.id}`, { title: 'Edit published' })).status
    ).toBe(409)
    const v2 = await call(admin, 'POST', `/lessons/${v1.id}/draft`)
    expect(v2.body.version).toBe(2)
    expect((await call(admin, 'POST', `/lessons/${v1.id}/draft`)).status).toBe(409)
    await call(admin, 'PATCH', `/lessons/${v2.body.id}`, { title: 'Version two' })
    expect((await call(admin, 'POST', `/lessons/${v2.body.id}/publish`)).body.status).toBe(
      'published'
    )
    const versions = await call(admin, 'GET', `/lessons/${v1.id}/versions`)
    expect(versions.body.items.map((row) => row.status)).toEqual(['published', 'superseded'])
    expect((await call(parent, 'GET', `/lessons/${v1.id}`)).status).toBe(404)
  })

  test('the admin list shows one current row per lesson with its version count', async () => {
    const v1 = await makePublishedLesson(admin)
    const v2 = await call(admin, 'POST', `/lessons/${v1.id}/draft`)
    await call(admin, 'POST', `/lessons/${v2.body.id}/publish`)
    await call(admin, 'POST', `/lessons/${v2.body.id}/draft`)
    const list = await call(admin, 'GET', '/lessons', undefined, { q: v1.slug })
    expect(list.body.total).toBe(1)
    expect(list.body.items[0]).toMatchObject({
      id: v2.body.id,
      status: 'published',
      version_count: 3,
      has_draft: true
    })
    const old = await call(admin, 'GET', '/lessons', undefined, {
      q: v1.slug,
      status: 'superseded'
    })
    expect(old.body.items.map((row) => row.id)).toEqual([v1.id])
    const mentorList = await call(mentor, 'GET', '/lessons', undefined, { q: v1.slug })
    expect(mentorList.body.items.map((row) => row.id)).toEqual([v2.body.id])
  })

  test('only admins switch the end-of-lesson check, and new versions keep it', async () => {
    const lesson = await makePublishedLesson(admin)
    expect(
      (await call(mentor, 'PATCH', `/lessons/${lesson.id}/check`, { enabled: true })).status
    ).toBe(403)
    expect(
      (await call(admin, 'PATCH', `/lessons/${lesson.id}/check`, { enabled: true, questions: 4 }))
        .status
    ).toBe(400)
    const on = await call(admin, 'PATCH', `/lessons/${lesson.id}/check`, {
      enabled: true,
      questions: 3
    })
    expect(on.body.check).toEqual({ questions: 3 })
    const draft = await call(admin, 'POST', `/lessons/${lesson.id}/draft`)
    expect(draft.body.check).toEqual({ questions: 3 })
    const off = await call(admin, 'PATCH', `/lessons/${lesson.id}/check`, { enabled: false })
    expect(off.body.check).toBeNull()
  })

  test('only a flashcard lesson has learn cards, each written out', () => {
    expect(learnCards({ player: 'story', steps: [{ text: 'Hi' }] })).toEqual([])
    expect(
      learnCards({ player: 'bubbles', steps: [{ art: ['duck'], answer: 'this', text: 'Pop' }] })
    ).toEqual([])
    expect(
      learnCards({
        player: 'cards',
        steps: [
          {
            text: 'The cat is in the box.',
            art: ['cat', 'box'],
            keys: ['in'],
            layout: 'in'
          }
        ]
      })
    ).toEqual([
      {
        text: 'The cat is in the box.',
        audio: null,
        art: ['cat', 'box'],
        keys: ['in'],
        colours: [],
        layout: 'in',
        sizes: []
      }
    ])
  })

  test('a flashcard lesson checks its cards', async () => {
    const card = (extra) => ({ text: 'The cat is in the box.', art: ['cat', 'box'], ...extra })
    const create = (step) =>
      call(admin, 'POST', '/lessons', {
        slug: `cards-${crypto.randomUUID().slice(0, 8)}`,
        title: 'Cards',
        content: { player: 'cards', steps: [step] }
      })
    expect((await create(card({ layout: 'in', keys: ['in'], colours: ['blue'] }))).status).toBe(201)
    expect((await create(card({ layout: 'in', art: ['cat'] }))).status).toBe(400)
    expect((await create(card({ keys: ['in'], colours: ['blue', 'red'] }))).status).toBe(400)
    expect((await create(card({ layout: 'sideways' }))).status).toBe(400)
    expect((await create({ text: 'No picture' })).status).toBe(400)
  })

  test('versionSummary counts versions and spots a draft', () => {
    const counts = [
      { slug: 'a', status: 'published', _count: { _all: 1 } },
      { slug: 'a', status: 'superseded', _count: { _all: 2 } },
      { slug: 'b', status: 'draft', _count: { _all: 1 } }
    ]
    expect(versionSummary(counts, 'a')).toEqual({ version_count: 3, has_draft: false })
    expect(versionSummary(counts, 'b')).toEqual({ version_count: 1, has_draft: true })
    expect(versionSummary(counts, 'c')).toEqual({ version_count: 0, has_draft: false })
  })

  test('the list says which game each lesson is, and parents only see assigned lessons', async () => {
    const lesson = await makePublishedLesson(admin)
    const list = await call(mentor, 'GET', '/lessons', undefined, { q: lesson.slug })
    expect(list.body.items[0]).toMatchObject({ id: lesson.id, player: 'story', step_count: 15 })
    expect((await call(parent, 'GET', '/lessons', undefined, { q: lesson.slug })).body.total).toBe(
      0
    )
  })

  test('duplicate slugs are rejected', async () => {
    const lesson = await makePublishedLesson(admin)
    expect(
      (await call(admin, 'POST', '/lessons', { slug: lesson.slug, title: 'Copy' })).status
    ).toBe(409)
  })

  test('the app database role cannot change the audit log', async () => {
    const error = await db.audit_logs.deleteMany().catch((e) => e)
    expect(error.meta.driverAdapterError.cause.originalCode).toBe('42501')
  })
})

describe('change requests', () => {
  test('mentor requests a change; admin approval creates a draft', async () => {
    const lesson = await makePublishedLesson(admin)
    expect((await call(parent, 'POST', '/change-requests', {})).status).toBe(403)
    const created = await call(mentor, 'POST', '/change-requests', {
      lesson_id: lesson.id,
      reason: 'Children find step one too fast',
      proposed_change: { summary: 'Split step one into two', step_index: 0 }
    })
    expect(created.status).toBe(201)
    expect(
      (
        await call(mentor, 'POST', `/change-requests/${created.body.id}/review`, {
          decision: 'approve'
        })
      ).status
    ).toBe(403)
    const approved = await call(admin, 'POST', `/change-requests/${created.body.id}/review`, {
      decision: 'approve'
    })
    expect(approved.body.status).toBe('approved')
    const draft = await call(admin, 'GET', `/lessons/${approved.body.metadata.draft_lesson_id}`)
    expect(draft.body.status).toBe('draft')
    expect(draft.body.version).toBe(2)
    expect(
      (
        await call(admin, 'POST', `/change-requests/${created.body.id}/review`, {
          decision: 'reject',
          review_note: 'x'
        })
      ).status
    ).toBe(409)
  })

  test('rejecting needs a note, and mentors only see their own requests', async () => {
    const lesson = await makePublishedLesson(admin)
    const { body } = await call(mentor, 'POST', '/change-requests', {
      lesson_id: lesson.id,
      reason: 'r',
      proposed_change: { summary: 's' }
    })
    expect(
      (await call(admin, 'POST', `/change-requests/${body.id}/review`, { decision: 'reject' }))
        .status
    ).toBe(400)
    const other = await makeUser('mentor')
    expect((await call(other, 'GET', `/change-requests/${body.id}`)).status).toBe(404)
    expect((await call(other, 'GET', '/change-requests')).body.total).toBe(0)
  })
})

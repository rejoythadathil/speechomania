import { beforeAll, describe, expect, test } from 'bun:test'
import { sql } from '../../../../../common-service/db/service/index.js'
import { call, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'

let admin, mentor, parent

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
})

describe('lessons', () => {
  test('only admins create lessons; drafts are hidden from others', async () => {
    expect((await call(mentor, 'POST', '/lessons', { slug: 'mentor-lesson', title: 'X' })).status).toBe(403)
    const draft = await call(admin, 'POST', '/lessons', { slug: `draft-${crypto.randomUUID().slice(0, 8)}`, title: 'Draft' })
    expect(draft.status).toBe(201)
    expect(draft.body.status).toBe('draft')
    expect((await call(parent, 'GET', `/lessons/${draft.body.id}`)).status).toBe(404)
    expect((await call(admin, 'POST', `/lessons/${draft.body.id}/publish`)).status).toBe(400)
  })

  test('publishing a new version supersedes the old one', async () => {
    const v1 = await makePublishedLesson(admin)
    expect((await call(admin, 'PATCH', `/lessons/${v1.id}`, { title: 'Edit published' })).status).toBe(409)
    const v2 = await call(admin, 'POST', `/lessons/${v1.id}/draft`)
    expect(v2.body.version).toBe(2)
    expect((await call(admin, 'POST', `/lessons/${v1.id}/draft`)).status).toBe(409)
    await call(admin, 'PATCH', `/lessons/${v2.body.id}`, { title: 'Version two' })
    expect((await call(admin, 'POST', `/lessons/${v2.body.id}/publish`)).body.status).toBe('published')
    const versions = await call(admin, 'GET', `/lessons/${v1.id}/versions`)
    expect(versions.body.items.map((row) => row.status)).toEqual(['published', 'superseded'])
    expect((await call(parent, 'GET', `/lessons/${v1.id}`)).status).toBe(404)
  })

  test('duplicate slugs are rejected', async () => {
    const lesson = await makePublishedLesson(admin)
    expect((await call(admin, 'POST', '/lessons', { slug: lesson.slug, title: 'Copy' })).status).toBe(409)
  })

  test('the app database role cannot change the audit log', async () => {
    const error = await sql`DELETE FROM audit_logs`.catch((e) => e)
    expect(error.errno).toBe('42501')
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
    expect((await call(mentor, 'POST', `/change-requests/${created.body.id}/review`, { decision: 'approve' })).status).toBe(403)
    const approved = await call(admin, 'POST', `/change-requests/${created.body.id}/review`, { decision: 'approve' })
    expect(approved.body.status).toBe('approved')
    const draft = await call(admin, 'GET', `/lessons/${approved.body.metadata.draft_lesson_id}`)
    expect(draft.body.status).toBe('draft')
    expect(draft.body.version).toBe(2)
    expect((await call(admin, 'POST', `/change-requests/${created.body.id}/review`, { decision: 'reject', review_note: 'x' })).status).toBe(409)
  })

  test('rejecting needs a note, and mentors only see their own requests', async () => {
    const lesson = await makePublishedLesson(admin)
    const { body } = await call(mentor, 'POST', '/change-requests', { lesson_id: lesson.id, reason: 'r', proposed_change: { summary: 's' } })
    expect((await call(admin, 'POST', `/change-requests/${body.id}/review`, { decision: 'reject' })).status).toBe(400)
    const other = await makeUser('mentor')
    expect((await call(other, 'GET', `/change-requests/${body.id}`)).status).toBe(404)
    expect((await call(other, 'GET', '/change-requests')).body.total).toBe(0)
  })
})

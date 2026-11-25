import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'
import { DAY_MS } from '../constants/index.js'
import { purgeExpired } from '../service/index.js'
import { cutoff, daysLeft, deletedMark, purgeOn, snippet, withoutMark } from '../utils/index.js'

let admin, mentor, parent

const inBackup = async (type, id) =>
  (await call(admin, 'GET', `/backup/${type}`, undefined, { page_size: 100 })).body.items.find(
    (item) => item.id === id
  )

const ageBy = async (model, id, days) => {
  const at = new Date(Date.now() - days * DAY_MS)
  const row = await db[model].findUnique({ where: { id } })
  await db[model].update({
    where: { id },
    data: {
      ...(row.deleted_at ? { deleted_at: at } : {}),
      metadata: { ...row.metadata, deleted: { ...row.metadata.deleted, at: at.toISOString() } }
    }
  })
}

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
})

describe('backup access', () => {
  test('only admins see Backup and its settings', async () => {
    for (const user of [mentor, parent]) {
      expect((await call(user, 'GET', '/backup')).status).toBe(403)
      expect((await call(user, 'GET', '/backup/children')).status).toBe(403)
      expect((await call(user, 'PUT', '/backup/settings', { retention_days: 60 })).status).toBe(403)
    }
    expect((await call(null, 'GET', '/backup')).status).toBe(401)
    expect((await call(admin, 'GET', '/backup/nothing')).status).toBe(400)
  })

  test('retention is 60 or 90 days, kept in the audit log', async () => {
    expect((await call(admin, 'PUT', '/backup/settings', { retention_days: 30 })).status).toBe(400)
    expect((await call(admin, 'PUT', '/backup/settings', { retention_days: 60 })).body).toEqual({
      retention_days: 60
    })
    expect((await call(admin, 'GET', '/backup/settings')).body.retention_days).toBe(60)
    expect((await call(admin, 'GET', '/backup')).body.retention_days).toBe(60)
    await call(admin, 'PUT', '/backup/settings', { retention_days: 90 })
    expect((await call(admin, 'GET', '/backup/settings')).body.retention_days).toBe(90)
  })
})

describe('soft delete and restore', () => {
  test('a deleted child leaves every list, waits in Backup, and comes back as it was', async () => {
    const child = await makeChild(parent, admin, mentor)
    expect((await call(admin, 'DELETE', `/children/${child.id}`)).status).toBe(204)
    expect((await call(parent, 'GET', `/children/${child.id}`)).status).toBe(404)
    const item = await inBackup('children', child.id)
    expect(item).toMatchObject({ type: 'children', title: 'Test child', days_left: 90 })
    expect(item.deleted_by).toBe('Test admin')
    expect((await call(admin, 'POST', `/backup/children/${child.id}/restore`)).status).toBe(200)
    expect((await call(parent, 'GET', `/children/${child.id}`)).body.status).toBe('active')
    expect(await inBackup('children', child.id)).toBeUndefined()
  })

  test('a note comes back only after its child', async () => {
    const child = await makeChild(parent, admin, mentor)
    const note = await call(mentor, 'POST', `/children/${child.id}/remarks`, { body: 'Good day.' })
    await call(mentor, 'DELETE', `/remarks/${note.body.id}`)
    await call(admin, 'DELETE', `/children/${child.id}`)
    expect((await inBackup('notes', note.body.id)).title).toBe('Good day.')
    expect((await call(admin, 'POST', `/backup/notes/${note.body.id}/restore`)).status).toBe(409)
    await call(admin, 'POST', `/backup/children/${child.id}/restore`)
    expect((await call(admin, 'POST', `/backup/notes/${note.body.id}/restore`)).status).toBe(200)
  })

  test('a restored mentor gets back the children that are still without a mentor', async () => {
    const other = await makeUser('mentor')
    const child = await makeChild(parent, admin, other)
    expect((await call(admin, 'DELETE', `/users/${other.id}`)).status).toBe(204)
    expect((await call(admin, 'GET', `/children/${child.id}`)).body.mentor_id).toBeNull()
    expect((await inBackup('people', other.id)).detail).toBe('Mentor')
    await call(admin, 'POST', `/backup/people/${other.id}/restore`)
    expect((await call(admin, 'GET', `/children/${child.id}`)).body.mentor_id).toBe(other.id)
    expect((await call(admin, 'GET', `/users/${other.id}`)).body.status).toBe('active')
  })

  test('a deleted draft lesson is hidden, and cannot come back over a newer draft', async () => {
    const lesson = await makePublishedLesson(admin)
    const draft = await call(admin, 'POST', `/lessons/${lesson.id}/draft`)
    await call(admin, 'DELETE', `/lessons/${draft.body.id}`)
    expect((await call(admin, 'GET', `/lessons/${draft.body.id}`)).status).toBe(404)
    expect((await inBackup('lessons', draft.body.id)).title).toBe('Test lesson')
    const again = await call(admin, 'POST', `/lessons/${lesson.id}/draft`)
    expect(again.status).toBe(201)
    expect((await call(admin, 'POST', `/backup/lessons/${draft.body.id}/restore`)).status).toBe(409)
    await call(admin, 'DELETE', `/lessons/${again.body.id}`)
    expect((await call(admin, 'POST', `/backup/lessons/${draft.body.id}/restore`)).status).toBe(200)
    expect((await call(admin, 'GET', `/lessons/${draft.body.id}`)).body.status).toBe('draft')
  })

  test('a deleted draft assessment is hidden from the list and restores as a draft', async () => {
    const created = await call(admin, 'POST', '/assessments', { title: 'Backup check' })
    await call(admin, 'DELETE', `/assessments/${created.body.id}`)
    expect((await call(admin, 'GET', `/assessments/${created.body.id}`)).status).toBe(404)
    const list = await call(admin, 'GET', '/assessments', undefined, { q: 'Backup check' })
    expect(list.body.items.map((row) => row.id)).not.toContain(created.body.id)
    await call(admin, 'POST', `/backup/assessments/${created.body.id}/restore`)
    expect((await call(admin, 'GET', `/assessments/${created.body.id}`)).body.status).toBe('draft')
  })

  test('restoring something that is not deleted is 404', async () => {
    const child = await makeChild(parent, admin, mentor)
    expect((await call(admin, 'POST', `/backup/children/${child.id}/restore`)).status).toBe(404)
  })
})

describe('purge', () => {
  test('items past the retention period leave the database; newer ones stay', async () => {
    const old = await makeChild(parent, admin, mentor)
    const fresh = await makeChild(parent, admin, mentor)
    const note = await call(mentor, 'POST', `/children/${old.id}/remarks`, { body: 'Old note.' })
    for (const child of [old, fresh]) await call(admin, 'DELETE', `/children/${child.id}`)
    const gone = await makeUser('mentor')
    await call(admin, 'DELETE', `/users/${gone.id}`)
    const draft = await call(admin, 'POST', '/assessments', { title: 'Old draft' })
    await call(admin, 'DELETE', `/assessments/${draft.body.id}`)
    await ageBy('children', old.id, 91)
    await ageBy('users', gone.id, 91)
    await ageBy('assessments', draft.body.id, 91)
    const purged = await purgeExpired()
    expect(purged.children).toBeGreaterThanOrEqual(1)
    expect(await db.children.findUnique({ where: { id: old.id } })).toBeNull()
    expect(await db.remarks.findUnique({ where: { id: note.body.id } })).toBeNull()
    expect(await db.assessments.findUnique({ where: { id: draft.body.id } })).toBeNull()
    expect(await db.children.findUnique({ where: { id: fresh.id } })).not.toBeNull()
    const user = await db.users.findUnique({ where: { id: gone.id } })
    expect(user).toMatchObject({ full_name: 'Deleted account', firebase_uid: null, phone: null })
    expect(user.email).toEndWith('@erased.invalid')
    expect(await inBackup('people', gone.id)).toBeUndefined()
    const logged = await db.audit_logs.findFirst({
      where: { action: 'backup.purged', entity_id: 'children' },
      orderBy: { created_at: 'desc' }
    })
    expect(logged.diff.ids).toContain(old.id)
  })
})

describe('backup helpers', () => {
  test('countdown, cutoff and marks', () => {
    const now = new Date('2026-11-25T10:00:00Z')
    const at = new Date('2026-11-20T10:00:00Z')
    expect(daysLeft(at, 60, now)).toBe(55)
    expect(daysLeft(new Date('2026-01-01'), 60, now)).toBe(0)
    expect(purgeOn(at, 90).toISOString()).toBe('2027-02-18T10:00:00.000Z')
    expect(cutoff(60, now).toISOString()).toBe('2026-09-26T10:00:00.000Z')
    expect(deletedMark({ id: 'u' }, { status: 'active' }, now)).toEqual({
      at: now.toISOString(),
      by: 'u',
      status: 'active'
    })
    expect(withoutMark({ deleted: {}, demo: true })).toEqual({ demo: true })
    expect(snippet('a'.repeat(100), 10)).toBe(`${'a'.repeat(9)}…`)
  })
})

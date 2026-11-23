import { beforeAll, describe, expect, test } from 'bun:test'
import { strFromU8, unzipSync } from 'fflate'
import { app } from '../../../../app.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makeUser, publishFixture } from '../../../../../test/helpers.js'

let admin, mentor, otherMentor, parent, mine, theirs

async function download(user, path, query) {
  const search = query ? `?${new URLSearchParams(query)}` : ''
  const response = await app.request(`/v1/exports${path}${search}`, {
    headers: user ? { authorization: `Bearer ${user.token}` } : {}
  })
  const bytes = new Uint8Array(await response.arrayBuffer())
  return { status: response.status, headers: response.headers, bytes }
}

function cells(bytes) {
  const files = unzipSync(bytes)
  const shared = strFromU8(files['xl/sharedStrings.xml'] ?? new Uint8Array())
  const sheets = Object.keys(files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
  return { text: shared, sheets: sheets.length }
}

async function namedChild(name, owner, by) {
  const child = await makeChild(parent, admin, owner)
  await call(admin, 'PATCH', `/children/${child.id}`, { display_name: name })
  return { ...child, display_name: name, by }
}

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  const tag = crypto.randomUUID().slice(0, 6)
  mine = await namedChild(`Mine ${tag}`, mentor)
  theirs = await namedChild(`Theirs ${tag}`, otherMentor)
})

describe('exports', () => {
  test('only admins and mentors export; parents and strangers are refused', async () => {
    expect((await download(parent, '/children')).status).toBe(403)
    expect((await download(null, '/children')).status).toBe(401)
  })

  test('a mentor’s children file holds only their children, named and audited', async () => {
    const file = await download(mentor, '/children', { q: mine.display_name.split(' ')[1] })
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toContain('spreadsheetml')
    expect(file.headers.get('cache-control')).toBe('no-store')
    const name = file.headers.get('content-disposition')
    expect(name).toMatch(
      /attachment; filename="speechomania_my-children_search-[a-z0-9-]+_\d{4}-\d{2}-\d{2}\.xlsx"/
    )
    const { text } = cells(file.bytes)
    expect(text).toContain(mine.display_name)
    expect(text).not.toContain(theirs.display_name)
    expect(text).not.toContain('Mentor')
    expect(text).not.toContain('@')
    const logged = await db.audit_logs.findFirst({
      where: { actor_id: mentor.id, action: 'export.children' },
      orderBy: { created_at: 'desc' }
    })
    expect(logged.diff.rows).toBe(1)
  })

  test('an admin’s children file sees everyone and names the mentor', async () => {
    const file = await download(admin, '/children', { q: mine.display_name.split(' ')[1] })
    const { text } = cells(file.bytes)
    expect(text).toContain(mine.display_name)
    expect(text).toContain(theirs.display_name)
    expect(text).toContain('Mentor')
  })

  test('assessment results export only the mentor’s children, with a questions sheet', async () => {
    const lesson = await call(admin, 'POST', '/lessons', {
      slug: `export-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Export source',
      content: {
        player: 'yesno',
        steps: Array.from({ length: 5 }, (_, index) => ({
          text: `Is this ${index}?`,
          art: ['dog'],
          answer: true
        }))
      }
    })
    await publishFixture(admin, lesson.body.id)
    const assessment = await call(admin, 'POST', '/assessments', {
      title: 'Export check',
      items: [{ lesson_id: lesson.body.id, step_index: 0 }]
    })
    await call(admin, 'POST', `/assessments/${assessment.body.id}/publish`)
    await call(mentor, 'POST', `/assessments/${assessment.body.id}/assignments`, {
      child_ids: [mine.id]
    })
    await call(otherMentor, 'POST', `/assessments/${assessment.body.id}/assignments`, {
      child_ids: [theirs.id]
    })
    const file = await download(mentor, `/assessments/${assessment.body.id}/results`)
    expect(file.status).toBe(200)
    expect(file.headers.get('content-disposition')).toContain(
      'speechomania_assessment-results_export-check_'
    )
    const { text, sheets } = cells(file.bytes)
    expect(sheets).toBe(2)
    expect(text).toContain(mine.display_name)
    expect(text).not.toContain(theirs.display_name)
    expect(text).toContain('Is this 0?')
    expect((await download(parent, `/assessments/${assessment.body.id}/results`)).status).toBe(403)
  })
})

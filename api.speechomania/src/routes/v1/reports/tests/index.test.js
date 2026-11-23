import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '../../../../app.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makeUser } from '../../../../../test/helpers.js'
import { progressDocument } from '../service/index.js'
import { progressData } from '../utils/index.js'

let admin, mentor, parent, otherParent, child

async function fetchReport(user, childId) {
  const response = await app.request(`/v1/reports/children/${childId}/progress`, {
    headers: user ? { authorization: `Bearer ${user.token}` } : {}
  })
  return {
    status: response.status,
    headers: response.headers,
    bytes: new Uint8Array(await response.arrayBuffer())
  }
}

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  parent = await makeUser('parent')
  otherParent = await makeUser('parent')
  child = await makeChild(parent, admin, mentor)
  await call(parent, 'PATCH', `/children/${child.id}`, { display_name: 'Riya' })
  await call(mentor, 'POST', `/children/${child.id}/remarks`, {
    body: 'Riya matched every colour today.',
    visibility: 'shared'
  })
  await call(mentor, 'POST', `/children/${child.id}/remarks`, {
    body: 'Private note for the team.',
    visibility: 'internal'
  })
})

describe('parent progress report', () => {
  test('only the child’s own parent gets it; staff and strangers are refused', async () => {
    expect((await fetchReport(otherParent, child.id)).status).toBe(404)
    expect((await fetchReport(mentor, child.id)).status).toBe(403)
    expect((await fetchReport(admin, child.id)).status).toBe(403)
    expect((await fetchReport(null, child.id)).status).toBe(401)
  })

  test('the parent downloads a named, uncached, audited PDF', async () => {
    const file = await fetchReport(parent, child.id)
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toBe('application/pdf')
    expect(file.headers.get('cache-control')).toBe('no-store')
    expect(file.headers.get('content-disposition')).toMatch(
      /attachment; filename="speechomania_progress_riya_\d{4}-\d{2}-\d{2}\.pdf"/
    )
    expect(new TextDecoder().decode(file.bytes.subarray(0, 5))).toBe('%PDF-')
    const logged = await db.audit_logs.findFirst({
      where: { actor_id: parent.id, action: 'report.progress', entity_id: child.id }
    })
    expect(logged.diff).toMatchObject({ remarks: 1 })
  })

  test('the report carries shared notes only and a watermark naming the parent', async () => {
    const { definition } = await progressDocument({ ...parent, full_name: 'Test parent' }, child.id)
    const text = JSON.stringify(definition)
    expect(text).toContain('Riya’s learning report')
    expect(text).toContain('Riya matched every colour today.')
    expect(text).not.toContain('Private note for the team.')
    expect(definition.watermark.text).toMatch(/^Prepared for Test parent · \d{1,2} \w{3} \d{4}$/)
    expect(text).not.toContain('{{')
  })
})

describe('progress data', () => {
  const learner = {
    display_name: 'Riya',
    stars: 7,
    games_played: 1,
    games_total: 2,
    trophies: [{}],
    levels: [{ level: 'indigo', played: 1, total: 2 }]
  }
  const shape = (extra) =>
    progressData({
      learner,
      lessons: [],
      assessments: [],
      remarks: [],
      parentName: 'Priya',
      today: new Date('2026-11-23T10:00:00Z'),
      ...extra
    })

  test('scores a check-in hides from parents stay hidden', () => {
    const data = shape({
      assessments: [
        { title: 'A', status: 'completed', score_hidden: true, latest: {} },
        { title: 'B', status: 'completed', latest: { score: 6, max_score: 8, percent: 75 } },
        { title: 'C', status: 'not_started', latest: null }
      ]
    })
    expect(data.assessments.map((row) => row.result)).toEqual([
      'Seen by the mentor',
      '6 of 8 (75%)',
      '—'
    ])
  })

  test('unplayed games show a dash, levels read as words, and notes are capped', () => {
    const data = shape({
      lessons: [
        { title: 'Feelings', level: 'indigo', times_completed: 0, best_stars: 0, max_stars: 3 },
        { title: 'A or an', level: 'green', times_completed: 2, best_stars: 3, max_stars: 3 }
      ],
      remarks: Array.from({ length: 30 }, () => ({
        created_at: '2026-11-20',
        author_name: 'Rahul',
        body: 'x'
      }))
    })
    expect(data.lessons.map((row) => [row.level, row.stars])).toEqual([
      ['Indigo', '—'],
      ['Green', '3 of 3']
    ])
    expect(data.levels[0].name).toBe('Indigo')
    expect(data.remarks).toHaveLength(20)
    expect(data.watermark).toBe('Prepared for Priya · 23 Nov 2026')
  })
})

import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '../../../../app.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'
import { cardsDocument, progressDocument } from '../service/index.js'
import { cardWords, cardsData, placePictures, progressData, rowPictures } from '../utils/index.js'

let admin, mentor, parent, otherParent, child, cardsLesson, storyLesson, unassigned

async function fetchReport(user, childId, path = 'progress') {
  const response = await app.request(`/v1/reports/children/${childId}/${path}`, {
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
  const tag = crypto.randomUUID().slice(0, 8)
  cardsLesson = await db.lessons.create({
    data: {
      slug: `cards-${tag}`,
      version: 1,
      title: 'Where is it?, part 1: flashcards',
      status: 'published',
      created_by: admin.id,
      published_by: admin.id,
      published_at: new Date(),
      content: {
        player: 'cards',
        steps: [
          { text: 'The cat is in the box.', art: ['cat', 'box'], keys: ['in'], layout: 'in' },
          {
            text: 'Hot and cold are opposites.',
            art: ['hot', 'cold'],
            keys: ['hot', 'cold'],
            colours: ['blue', 'orange']
          },
          { text: 'This is a mystery.', art: ['no-such-picture'], keys: [] }
        ]
      }
    }
  })
  storyLesson = await makePublishedLesson(admin, `story-${tag}`)
  unassigned = await makePublishedLesson(admin, `other-${tag}`)
  await call(admin, 'PUT', `/children/${child.id}/lessons`, {
    slugs: [cardsLesson.slug, storyLesson.slug]
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
      where: { actor_id: parent.id, action: 'report.issued', entity_id: child.id },
      orderBy: { created_at: 'desc' }
    })
    expect(logged.diff).toMatchObject({ kind: 'progress', remarks: 1, bytes: file.bytes.length })
    expect(logged.diff.code).toMatch(/^SPM-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(logged.diff.sha256).toBe(new Bun.CryptoHasher('sha256').update(file.bytes).digest('hex'))
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

describe('printable flashcards', () => {
  const cardsPath = (lessonId) => `lessons/${lessonId}/cards`

  test('only the child’s parent prints cards, and only for an assigned flashcard lesson', async () => {
    expect((await fetchReport(otherParent, child.id, cardsPath(cardsLesson.id))).status).toBe(404)
    expect((await fetchReport(mentor, child.id, cardsPath(cardsLesson.id))).status).toBe(403)
    expect((await fetchReport(null, child.id, cardsPath(cardsLesson.id))).status).toBe(401)
    expect((await fetchReport(parent, child.id, cardsPath(unassigned.id))).status).toBe(404)
    expect((await fetchReport(parent, child.id, cardsPath(storyLesson.id))).status).toBe(400)
  })

  test('the parent downloads a named, audited flashcards PDF', async () => {
    const file = await fetchReport(parent, child.id, cardsPath(cardsLesson.id))
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toBe('application/pdf')
    expect(file.headers.get('content-disposition')).toMatch(
      /filename="speechomania_flashcards_riya_where-is-it_\d{4}-\d{2}-\d{2}\.pdf"/
    )
    const logged = await db.audit_logs.findFirst({
      where: { actor_id: parent.id, action: 'report.issued', entity_id: child.id },
      orderBy: { created_at: 'desc' }
    })
    expect(logged.diff).toMatchObject({ kind: 'cards', cards: 3, lesson: cardsLesson.slug })
  })

  test('cards carry their pictures; a missing picture is left out, not drawn', async () => {
    const { definition, data } = await cardsDocument(parent, child.id, cardsLesson.id)
    expect(Object.keys(definition.images).sort()).toEqual(['box', 'cat', 'cold', 'hot'])
    expect(data.cards[2].box.pictures).toEqual([])
    expect(data.lesson.title).toBe('Where is it?')
  })
})

describe('card layout', () => {
  test('key words are coloured without their punctuation', () => {
    expect(
      cardWords({ text: 'Hot and cold.', keys: ['hot', 'cold'], colours: ['red', 'blue'] })
    ).toEqual([
      { text: 'Hot', colour: '#c8483d', key: true },
      { text: ' ' },
      { text: 'and ' },
      { text: 'cold', colour: '#1479bb', key: true },
      { text: '.' }
    ])
  })

  test('a thing in, on or behind a place sits where the sentence says', () => {
    const inside = placePictures('in', ['cat', 'box'], 100)
    expect(inside.pictures.map((picture) => picture.name)).toEqual(['box', 'cat'])
    expect(inside.pictures[1]).toMatchObject({ x: 31, y: 37, width: 38 })
    const behind = placePictures('behind', ['dog', 'house'], 100)
    expect(behind.pictures.map((picture) => picture.name)).toEqual(['dog', 'house'])
    const beside = placePictures('beside', ['dog', 'house'], 100)
    expect(beside.width).toBeGreaterThan(100)
    expect(Math.min(...beside.pictures.map((picture) => picture.x))).toBe(0)
  })

  test('row pictures share the width and line up at the bottom', () => {
    const row = rowPictures(['big', 'small'], [1.3, 0.6], 100)
    expect(row.pictures[1].y).toBeGreaterThan(row.pictures[0].y)
    expect(row.pictures.at(-1).x + row.pictures.at(-1).width).toBe(row.width)
  })

  test('cards fill pages of six, two to a row', () => {
    const steps = Array.from({ length: 7 }, (_, index) => ({ text: `Card ${index}`, art: [] }))
    const data = cardsData({
      learner: { display_name: 'Riya' },
      lesson: { title: 'Colours, part 1: flashcards', content: { steps } },
      parentName: 'Priya',
      today: new Date('2026-11-23T10:00:00Z'),
      hasArt: () => true
    })
    expect(data.pages.map((page) => page.length)).toEqual([3, 1])
    expect(data.pages[1][0]).toEqual([data.cards[6], null])
    expect(data.lesson.title).toBe('Colours')
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

  test('games group by colour level, unplayed games show a dash, and notes are capped', () => {
    const data = shape({
      lessons: [
        { title: 'A or an', level: 'green', times_completed: 2, best_stars: 3, max_stars: 3 },
        { title: 'Feelings', level: 'indigo', times_completed: 0, best_stars: 0, max_stars: 3 },
        { title: 'Free play', level: null, times_completed: 1, best_stars: 1, max_stars: 4 }
      ],
      remarks: Array.from({ length: 30 }, () => ({
        created_at: '2026-11-20',
        author_name: 'Rahul',
        body: 'x'
      }))
    })
    expect(data.groups.map((group) => [group.name, group.games.map((game) => game.stars)])).toEqual(
      [
        ['Indigo', ['—']],
        ['Green', ['3 of 3']],
        ['More games', ['1 of 4']]
      ]
    )
    expect(data.groups[1].games[0]).toMatchObject({ times: '2 times', bar: 90 })
    expect(data.levels[0].name).toBe('Indigo')
    expect(data.remarks).toHaveLength(20)
    expect(data.watermark).toBe('Prepared for Priya · 23 Nov 2026')
  })
})

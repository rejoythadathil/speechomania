import { describe, expect, test } from 'bun:test'
import { RENDER_QUEUE, RENDER_SLOTS } from '../constants/index.js'
import { limitExports, withRenderSlot } from '../service/index.js'
import { ageOn, everyRow, reportFileName, sheetOf, wordsOf } from '../utils/index.js'

describe('reports', () => {
  test('files are named speechomania_<what>_<filters>_<date>.<extension>', () => {
    const day = new Date(2026, 10, 23)
    expect(reportFileName('children', [], 'xlsx', day)).toBe(
      'speechomania_children_2026-11-23.xlsx'
    )
    expect(reportFileName('progress', ['Atharv K.', null], 'pdf', day)).toBe(
      'speechomania_progress_atharv-k_2026-11-23.pdf'
    )
  })

  test('helpers read as plain words and ages', () => {
    expect(wordsOf('not_started')).toBe('Not started')
    expect(ageOn('2020-12-01', new Date(2026, 10, 23))).toBe(5)
    expect(sheetOf('S', [{ label: 'A', value: (row) => row.a }], [{ a: 1 }]).data).toEqual([
      [{ value: 'A', fontWeight: 'bold' }],
      [1]
    ])
  })

  test('every page is read, and an export over the row limit is refused', async () => {
    const pages = { 1: [1, 2], 2: [3] }
    expect(
      await everyRow(async (page) => ({ items: pages[page], total: 3, total_pages: 2 }))
    ).toEqual([1, 2, 3])
    await expect(
      everyRow(async () => ({ items: [], total: 9000, total_pages: 90 }), 5000)
    ).rejects.toMatchObject({ status: 400 })
  })

  test('only a few files render at once; past the queue the server says busy', async () => {
    let live = 0
    let most = 0
    const release = []
    const slow = () =>
      new Promise((resolve) => {
        live += 1
        most = Math.max(most, live)
        release.push(() => {
          live -= 1
          resolve()
        })
      })
    const jobs = Array.from({ length: RENDER_SLOTS + RENDER_QUEUE + 2 }, () =>
      withRenderSlot(slow).then(
        () => 'done',
        (error) => error.status
      )
    )
    await Bun.sleep(10)
    while (release.length) {
      release.shift()()
      await Bun.sleep(1)
    }
    const outcomes = await Promise.all(jobs)
    expect(most).toBe(RENDER_SLOTS)
    expect(outcomes.filter((outcome) => outcome === 503)).toHaveLength(2)
    expect(outcomes.filter((outcome) => outcome === 'done')).toHaveLength(
      RENDER_SLOTS + RENDER_QUEUE
    )
  })

  test('one person gets ten exports a minute', async () => {
    const user = { id: crypto.randomUUID() }
    for (let index = 0; index < 10; index += 1) await limitExports(user)
    await expect(limitExports(user)).rejects.toMatchObject({ status: 429 })
  })
})

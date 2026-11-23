import { expect, test } from 'bun:test'
import { exportFileName, fetchAllPages, label, sheetOf } from './export.js'

const day = new Date(2026, 10, 23)

test('export files are named speechomania_<what>_<filters>_<date>.xlsx', () => {
  expect(exportFileName('children', [], day)).toBe('speechomania_children_2026-11-23.xlsx')
  expect(exportFileName('assessment-results', ['Colours check: Term 1', null], day)).toBe(
    'speechomania_assessment-results_colours-check-term-1_2026-11-23.xlsx'
  )
})

test('every page of a list is fetched, and a runaway list stops at the cap', async () => {
  const pages = { 1: [1, 2], 2: [3] }
  const all = await fetchAllPages(async (page) => ({
    items: pages[page],
    total: 3,
    total_pages: 2
  }))
  expect(all).toEqual({ items: [1, 2, 3], total: 3, complete: true })
  const endless = await fetchAllPages(async () => ({ items: [0], total: 9999, total_pages: 9999 }))
  expect(endless.complete).toBe(false)
  expect(endless.items).toHaveLength(50)
})

test('a sheet has a bold header row and one row per item', () => {
  const sheet = sheetOf('Kids', [{ label: 'Name', value: (row) => row.name }], [{ name: 'A' }])
  expect(sheet.data).toEqual([[{ value: 'Name', fontWeight: 'bold' }], ['A']])
})

test('status values read as words', () => {
  expect(label('not_started')).toBe('Not started')
  expect(label(null)).toBe(null)
})

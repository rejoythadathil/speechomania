import { MAX_ROWS, PAGE_SIZE } from '../constants/index.js'
import { tooManyRows } from '../exception/index.js'

const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

export const isoDay = (date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')

export function reportFileName(kind, scope = [], extension = 'xlsx', date = new Date()) {
  const parts = ['speechomania', kind, ...scope.filter(Boolean)].map(slug).filter(Boolean)
  return `${[...parts, isoDay(date)].join('_')}.${extension}`
}

export function wordsOf(value) {
  if (!value) return null
  const text = String(value).replaceAll('_', ' ')
  return text[0].toUpperCase() + text.slice(1)
}

export function ageOn(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null
  const born = new Date(dateOfBirth)
  let years = today.getFullYear() - born.getFullYear()
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) years -= 1
  return years
}

export const dateCell = (value) =>
  value ? { value: new Date(value), type: Date, format: 'dd mmm yyyy' } : null

export function sheetOf(name, columns, rows) {
  return {
    sheet: name,
    stickyRowsCount: 1,
    columns: columns.map((column) => ({ width: column.width ?? 18 })),
    data: [
      columns.map((column) => ({ value: column.label, fontWeight: 'bold' })),
      ...rows.map((row) => columns.map((column) => column.value(row) ?? null))
    ]
  }
}

export async function everyRow(fetchPage, max = MAX_ROWS) {
  const first = await fetchPage(1, PAGE_SIZE)
  if (first.total > max) throw tooManyRows(first.total, max)
  const items = [...first.items]
  for (let page = 2; page <= first.total_pages; page += 1) {
    items.push(...(await fetchPage(page, PAGE_SIZE)).items)
  }
  return items
}

export const longDate = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value))

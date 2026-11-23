export const EXPORT_PAGE_SIZE = 100
export const MAX_EXPORT_PAGES = 50

const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

const day = (date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')

export function exportFileName(kind, scope = [], date = new Date()) {
  const parts = ['speechomania', kind, ...scope.filter(Boolean)].map(slug).filter(Boolean)
  return `${[...parts, day(date)].join('_')}.xlsx`
}

export async function fetchAllPages(fetchPage) {
  const items = []
  for (let page = 1; page <= MAX_EXPORT_PAGES; page += 1) {
    const result = await fetchPage(page, EXPORT_PAGE_SIZE)
    items.push(...result.items)
    if (page >= result.total_pages) return { items, total: result.total, complete: true }
  }
  return { items, total: items.length, complete: false }
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

export const label = (value) => {
  if (!value) return null
  const text = String(value).replaceAll('_', ' ')
  return text[0].toUpperCase() + text.slice(1)
}

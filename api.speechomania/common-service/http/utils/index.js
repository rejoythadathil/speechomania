export const json = (value) => JSON.stringify(value ?? null)

export function requestCtx(c) {
  return { ip: c.get('ip') ?? null, requestId: c.get('requestId') ?? null }
}

export const likePattern = (text) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`

export function pageMeta(total, { page, page_size }) {
  return { page, page_size, total, total_pages: Math.max(1, Math.ceil(total / page_size)) }
}

export async function pageOf(db, base, order, window) {
  const [items, [{ total }]] = await Promise.all([
    db`SELECT * FROM (${base}) list ORDER BY ${order} LIMIT ${window.page_size} OFFSET ${(window.page - 1) * window.page_size}`,
    db`SELECT count(*)::int AS total FROM (${base}) list`
  ])
  return { items, ...pageMeta(total, window) }
}

export function pageArray(all, window) {
  const start = (window.page - 1) * window.page_size
  return { items: all.slice(start, start + window.page_size), ...pageMeta(all.length, window) }
}

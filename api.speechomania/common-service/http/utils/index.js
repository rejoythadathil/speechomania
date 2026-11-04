export function requestCtx(c) {
  return { ip: c.get('ip') ?? null, requestId: c.get('requestId') ?? null }
}

export const containsText = (text) => ({
  contains: text.replace(/[\\%_]/g, (char) => `\\${char}`),
  mode: 'insensitive'
})

export function pageMeta(total, { page, page_size }) {
  return { page, page_size, total, total_pages: Math.max(1, Math.ceil(total / page_size)) }
}

export async function pageOf(model, args, window) {
  const [items, total] = await Promise.all([
    model.findMany({ ...args, skip: (window.page - 1) * window.page_size, take: window.page_size }),
    model.count({ where: args.where })
  ])
  return { items, ...pageMeta(total, window) }
}

export function pageArray(all, window) {
  const start = (window.page - 1) * window.page_size
  return { items: all.slice(start, start + window.page_size), ...pageMeta(all.length, window) }
}

export const isoDate = (date) => (date ? date.toISOString().slice(0, 10) : null)

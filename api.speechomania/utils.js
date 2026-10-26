import Joi from 'joi'

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const notFound = (what = 'Record') => new HttpError(404, `${what} not found`)
export const forbidden = () => new HttpError(403, 'You do not have permission to do this')

export const json = (value) => JSON.stringify(value ?? null)

export function requestCtx(c) {
  return { ip: c.get('ip') ?? null, requestId: c.get('requestId') ?? null }
}

export const likePattern = (text) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`

export const pageQuery = {
  page: Joi.number().integer().min(1).max(10000).default(1),
  page_size: Joi.number().integer().min(1).max(100).default(25)
}

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

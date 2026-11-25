import { DAY_MS } from '../constants/index.js'

export const deletedMark = (user, extra = {}, now = new Date()) => ({
  at: now.toISOString(),
  by: user.id,
  ...extra
})

export const withoutMark = (metadata) =>
  Object.fromEntries(Object.entries(metadata ?? {}).filter(([key]) => key !== 'deleted'))

export const cutoff = (days, now = new Date()) => new Date(now.getTime() - days * DAY_MS)

export const purgeOn = (deletedAt, days) => new Date(new Date(deletedAt).getTime() + days * DAY_MS)

export const daysLeft = (deletedAt, days, now = new Date()) =>
  Math.max(0, Math.ceil((purgeOn(deletedAt, days).getTime() - now.getTime()) / DAY_MS))

export const snippet = (text, length = 90) =>
  text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text

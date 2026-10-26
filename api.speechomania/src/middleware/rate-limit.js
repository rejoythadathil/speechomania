import { valkey } from '../../common-service/cache/index.js'
import { logger } from '../../common-service/logger/index.js'
import { config } from '../../config/index.js'
import { HttpError } from '../../utils.js'

export async function rateLimit(c, next) {
  const key = `rate:${c.get('ip') ?? 'unknown'}:${Math.floor(Date.now() / 60000)}`
  let count = 0
  try {
    count = await valkey.incr(key)
    if (count === 1) await valkey.expire(key, 60)
  } catch (error) {
    logger.warn({ err: error }, 'rate limiter unavailable')
  }
  if (count > config.RATE_LIMIT_PER_MINUTE) throw new HttpError(429, 'Too many requests. Wait a minute and try again.')
  await next()
}

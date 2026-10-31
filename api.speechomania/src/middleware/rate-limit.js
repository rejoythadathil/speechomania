import { valkey } from '../../common-service/cache/service/index.js'
import { logger } from '../../common-service/logger/service/index.js'
import { config } from '../../config/index.js'
import { tooManyRequests } from '../../common-service/http/exception/index.js'

export async function rateLimit(c, next) {
  const key = `rate:${c.get('ip') ?? 'unknown'}:${Math.floor(Date.now() / 60000)}`
  let count = 0
  try {
    count = await valkey.incr(key)
    if (count === 1) await valkey.expire(key, 60)
  } catch (error) {
    logger.warn({ err: error }, 'rate limiter unavailable')
  }
  if (count > config.RATE_LIMIT_PER_MINUTE) throw tooManyRequests()
  await next()
}

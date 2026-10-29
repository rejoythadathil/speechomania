import { getConnInfo } from 'hono/bun'
import { logger } from '../../common-service/logger/service/index.js'
import { config } from '../../config/index.js'

function remoteAddress(c) {
  try {
    return getConnInfo(c).remote.address ?? null
  } catch {
    return null
  }
}

export async function context(c, next) {
  const forwarded = config.TRUST_PROXY ? c.req.header('x-real-ip') : undefined
  c.set('ip', forwarded ?? remoteAddress(c))
  const started = performance.now()
  await next()
  logger.info({
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Math.round(performance.now() - started),
    userId: c.get('user')?.id
  }, 'request')
}

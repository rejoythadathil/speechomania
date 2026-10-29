import { HTTPException } from 'hono/http-exception'
import { logger } from '../../common-service/logger/service/index.js'
import { fromPostgres } from '../../common-service/db/exception/index.js'
import { HttpError } from '../../common-service/http/exception/index.js'

export function onError(error, c) {
  if (error instanceof HttpError) {
    return c.json({ error: { message: error.message, details: error.details } }, error.status)
  }
  if (error instanceof HTTPException) {
    return c.json({ error: { message: error.message || 'Request rejected' } }, error.status)
  }
  const known = fromPostgres(error)
  if (known) return c.json({ error: { message: known.message } }, known.status)
  logger.error({ err: error, requestId: c.get('requestId') }, 'unhandled error')
  return c.json({ error: { message: 'Something went wrong. Try again.' } }, 500)
}

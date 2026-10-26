import { HTTPException } from 'hono/http-exception'
import { logger } from '../../common-service/logger/index.js'
import { HttpError } from '../../utils.js'

const PG_ERRORS = {
  23505: [409, 'This already exists'],
  23503: [409, 'This is still linked to other records'],
  '22P02': [400, 'One of the values has the wrong format'],
  42501: [403, 'This action is not allowed']
}

export function onError(error, c) {
  if (error instanceof HttpError) {
    return c.json({ error: { message: error.message, details: error.details } }, error.status)
  }
  if (error instanceof HTTPException) {
    return c.json({ error: { message: error.message || 'Request rejected' } }, error.status)
  }
  const known = PG_ERRORS[error.errno]
  if (known) return c.json({ error: { message: known[1] } }, known[0])
  logger.error({ err: error, requestId: c.get('requestId') }, 'unhandled error')
  return c.json({ error: { message: 'Something went wrong. Try again.' } }, 500)
}

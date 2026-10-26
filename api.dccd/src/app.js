import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { sql } from '../common-service/db/index.js'
import { config } from '../config/index.js'
import { context } from './middleware/context.js'
import { onError } from './middleware/error.js'
import { rateLimit } from './middleware/rate-limit.js'
import { v1 } from './routes/v1/index.js'

export const app = new Hono()
  .use(requestId())
  .use(context)
  .use(secureHeaders({ strictTransportSecurity: false }))
  .use('/v1/*', cors({
    origin: config.corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 600
  }))
  .use('/v1/*', bodyLimit({ maxSize: 1024 * 1024 }))
  .use('/v1/*', rateLimit)
  .get('/health', async (c) => {
    await sql`SELECT 1`
    return c.json({ status: 'ok' })
  })
  .route('/v1', v1)
  .notFound((c) => c.json({ error: { message: 'Not found' } }, 404))
  .onError(onError)

import { sql } from './common-service/db/index.js'
import { logger } from './common-service/logger/index.js'
import { config } from './config/index.js'
import { app } from './src/app.js'

const server = Bun.serve({ port: config.PORT, fetch: app.fetch })
logger.info({ port: server.port }, 'api listening')

async function shutdown(signal) {
  logger.info({ signal }, 'shutting down')
  await server.stop()
  await sql.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

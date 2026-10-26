import pino from 'pino'
import { config } from '../../config/index.js'

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'api', env: config.APP_ENV },
  redact: ['authorization', 'email', 'phone', 'body']
})

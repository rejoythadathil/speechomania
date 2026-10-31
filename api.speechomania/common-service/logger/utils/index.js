import { REDACT_PATHS } from '../constants/index.js'

export function loggerOptions(config) {
  return {
    level: config.LOG_LEVEL,
    base: { service: 'api', env: config.APP_ENV },
    redact: REDACT_PATHS
  }
}

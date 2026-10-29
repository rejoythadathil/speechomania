import pino from 'pino'
import { config } from '../../../config/index.js'
import { loggerOptions } from '../utils/index.js'

export const logger = pino(loggerOptions(config))

import { SQL } from 'bun'
import { config } from '../../../config/index.js'

export const sql = new SQL({ url: config.DATABASE_URL, prepare: false, max: config.DATABASE_POOL_MAX })

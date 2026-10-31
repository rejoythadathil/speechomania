import { config } from '../../../config/index.js'

export const valkey = new Bun.RedisClient(config.VALKEY_URL)

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../node_modules/.prisma-client/client.ts'
import { config } from '../../../config/index.js'

export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.DATABASE_URL, max: config.DATABASE_POOL_MAX })
})

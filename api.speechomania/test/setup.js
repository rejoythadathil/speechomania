import { SQL } from 'bun'

const ownerBase = new URL(process.env.DATABASE_OWNER_URL)
const appBase = new URL(process.env.DATABASE_URL)
const TEST_DB = 'speechomania_test'

const admin = new SQL({ url: ownerBase.toString(), prepare: false, max: 1 })
await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`)
await admin.unsafe(`CREATE DATABASE ${TEST_DB}`)
await admin.close()

ownerBase.pathname = `/${TEST_DB}`
appBase.pathname = `/${TEST_DB}`

const owner = new SQL({ url: ownerBase.toString(), prepare: false, max: 1 })
const appUser = appBase.username
const ownerUser = ownerBase.username
await owner.unsafe(`
  GRANT CONNECT ON DATABASE ${TEST_DB} TO ${appUser};
  GRANT USAGE ON SCHEMA public TO ${appUser};
  ALTER DEFAULT PRIVILEGES FOR ROLE ${ownerUser} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser};
  ALTER DEFAULT PRIVILEGES FOR ROLE ${ownerUser} IN SCHEMA public GRANT USAGE ON SEQUENCES TO ${appUser};
`)
await owner.close()

const migrate = Bun.spawnSync(['bun', '--bun', 'prisma', 'migrate', 'deploy'], { env: { ...process.env, DATABASE_OWNER_URL: ownerBase.toString() } })
if (migrate.exitCode !== 0) throw new Error(`migration failed: ${migrate.stderr}`)

process.env.DATABASE_URL = appBase.toString()
process.env.DATABASE_OWNER_URL = ownerBase.toString()
process.env.LOG_LEVEL = 'silent'
process.env.RATE_LIMIT_PER_MINUTE = '100000'

import { mkdir } from 'node:fs/promises'

const name = process.argv[2]
if (!name || !/^[a-z0-9_]+$/.test(name)) {
  console.error('Usage: bun run migrate:new <name_in_snake_case>')
  process.exit(1)
}

const diff = Bun.spawnSync(
  [
    'bun',
    '--bun',
    'prisma',
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--script'
  ],
  { stderr: 'inherit' }
)
if (diff.exitCode !== 0) process.exit(diff.exitCode)

const sql = diff.stdout
  .toString()
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

if (!sql) {
  console.log('schema.prisma matches the database. Nothing to create.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const folder = `${stamp}_${name}`
await mkdir(new URL(`../prisma/migrations/${folder}/`, import.meta.url), { recursive: true })
await Bun.write(
  new URL(`../prisma/migrations/${folder}/migration.sql`, import.meta.url),
  `${sql}\n`
)
console.log(`Created prisma/migrations/${folder}/migration.sql`)
console.log(
  'Review it, add CHECK constraints or grants Prisma cannot express, then run: bun run migrate'
)

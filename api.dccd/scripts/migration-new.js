import { readdir } from 'node:fs/promises'

const name = process.argv[2]
if (!name || !/^[a-z0-9_]+$/.test(name)) {
  console.error('Usage: bun run migrate:new <name_in_snake_case>')
  process.exit(1)
}

const dir = new URL('../prisma/migrations/', import.meta.url)
const before = new Set(await readdir(dir))
const run = Bun.spawnSync(['bun', '--bun', 'prisma', 'migrate', 'dev', '--create-only', '--name', name], { stdout: 'inherit', stderr: 'inherit' })
if (run.exitCode !== 0) process.exit(run.exitCode)

const lock = new URL('migration_lock.toml', dir)
const lockText = await Bun.file(lock).text()
await Bun.write(lock, `${lockText.split('\n').filter((line) => line.trim() && !line.trimStart().startsWith('#')).join('\n')}\n`)

const created = (await readdir(dir)).filter((entry) => !before.has(entry) && !entry.endsWith('.toml'))
if (!created.length) {
  console.log('schema.prisma matches the migrations. Nothing to create.')
  process.exit(0)
}

for (const folder of created) {
  const file = new URL(`${folder}/migration.sql`, dir)
  const text = await Bun.file(file).text()
  const clean = text.split('\n').filter((line) => !line.trimStart().startsWith('--')).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  await Bun.write(file, `${clean}\n`)
  console.log(`Created prisma/migrations/${folder}/migration.sql`)
  console.log('Review it, add CHECK constraints or grants Prisma cannot express, then run: bun run migrate')
}

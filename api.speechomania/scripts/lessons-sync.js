import { audit } from '../common-service/audit/service/index.js'
import { db } from '../common-service/db/service/index.js'
import { lessonLines } from '../common-service/voice/utils/index.js'
import { LESSONS } from '../seeds/lessons.js'
import { createDraftFrom, publishLesson } from '../src/routes/v1/lessons/service/index.js'
import { createBody } from '../src/routes/v1/lessons/validation/index.js'

const publish = process.argv.includes('--publish')
const assign = process.argv.includes('--assign')

const owner = await db.users.findFirst({
  where: { role: 'admin', deleted_at: null },
  orderBy: { created_at: 'asc' },
  select: { id: true, role: true }
})
if (!owner) {
  console.error('No admin to own the lessons.')
  process.exit(1)
}

const sorted = (value) =>
  Array.isArray(value)
    ? value.map(sorted)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .filter((key) => key !== 'audio')
            .sort()
            .map((key) => [key, sorted(value[key])])
        )
      : value
const strip = (content) => JSON.stringify(sorted(content))

function carryAudio(content, from) {
  const known = new Map(
    lessonLines(from ?? {})
      .filter((line) => line.audio)
      .map((line) => [line.text, line.audio])
  )
  for (const line of lessonLines(content)) {
    if (known.has(line.text)) line.audio = known.get(line.text)
  }
  return content
}

const partOne = new Map()
for (const [game, , content] of LESSONS) {
  if (content.after) partOne.set(content.after, [...(partOne.get(content.after) ?? []), game])
}

async function give(slug, wanted) {
  const children = await db.children.findMany({
    where: { deleted_at: null, NOT: { assigned_lessons: { equals: [] } } },
    select: { id: true, assigned_lessons: true }
  })
  let added = 0
  for (const child of children) {
    const lessons = child.assigned_lessons ?? []
    if (lessons.includes(slug) || !wanted(lessons)) continue
    await db.children.update({
      where: { id: child.id },
      data: { assigned_lessons: [...lessons, slug] }
    })
    added += 1
  }
  console.log(`assigned   ${slug} to ${added} more children`)
}

for (const [slug, title, source, status] of LESSONS) {
  const { value, error } = createBody.validate({ slug, title, content: source })
  if (error) {
    console.error(`${slug}: ${error.message}`)
    process.exit(1)
  }
  const rows = await db.lessons.findMany({
    where: { slug, status: { in: ['draft', 'published'] } }
  })
  const draft = rows.find((row) => row.status === 'draft')
  const live = rows.find((row) => row.status === 'published')
  const content = carryAudio(structuredClone(value.content), (draft ?? live)?.content)
  let draftId = draft?.id
  if (!rows.length) {
    if (await db.lessons.findFirst({ where: { slug }, select: { id: true } })) {
      console.log(`skip       ${slug} (only old versions exist)`)
      continue
    }
    draftId = (
      await db.lessons.create({
        data: { slug, version: 1, title, content, created_by: owner.id },
        select: { id: true }
      })
    ).id
    console.log(`new        ${slug}`)
  } else if (!draft && strip(live.content) === strip(content) && live.title === title) {
    console.log(`unchanged  ${slug}`)
    continue
  } else {
    if (!draftId) draftId = (await db.$transaction((tx) => createDraftFrom(tx, owner, live, {}))).id
    await db.$transaction(async (tx) => {
      await tx.lessons.updateMany({
        where: { id: draftId, status: 'draft' },
        data: { title, content }
      })
      await audit(tx, {
        actor: owner,
        action: 'lesson.synced',
        entityType: 'lesson',
        entityId: draftId,
        diff: { slug }
      })
    })
    console.log(`draft      ${slug}`)
  }
  if (publish && status === 'published') {
    const missing = lessonLines(content).filter((line) => !line.audio).length
    await publishLesson(owner, draftId, {})
    console.log(`published  ${slug}${missing ? ` (${missing} lines without voice)` : ''}`)
    if (assign && !live && !partOne.has(slug)) await give(slug, () => true)
  }
}

if (assign && publish) {
  for (const [slug, games] of partOne) {
    if (!(await db.lessons.findFirst({ where: { slug, status: 'published' } }))) continue
    await give(slug, (lessons) => lessons.some((lesson) => games.includes(lesson)))
  }
}
await db.$disconnect()

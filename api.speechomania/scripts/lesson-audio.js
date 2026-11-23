import { db } from '../common-service/db/service/index.js'
import { ensureMediaBucket } from '../common-service/storage/service/index.js'
import { voiceReady } from '../common-service/voice/service/index.js'
import { config } from '../config/index.js'
import { createDraftFrom, voiceLesson } from '../src/routes/v1/lessons/service/index.js'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: bun run audio <lesson-slug>')
  process.exit(1)
}
if (!voiceReady) {
  console.error('Set ELEVENLABS_API_KEY and the S3_* settings in .env first.')
  process.exit(1)
}
if (config.APP_ENV === 'local') await ensureMediaBucket()

const candidates = await db.lessons.findMany({
  where: { slug, status: { in: ['draft', 'published'] } }
})
const source = candidates.find((lesson) => lesson.status === 'draft') ?? candidates[0]
if (!source) {
  console.error(`No draft or published lesson with the slug "${slug}".`)
  process.exit(1)
}

const owner = { id: source.published_by ?? source.created_by, role: 'admin' }
const draftId =
  source.status === 'draft'
    ? source.id
    : (await db.$transaction((tx) => createDraftFrom(tx, owner, source, {}))).id
const { voiced } = await voiceLesson(owner, draftId, {})
console.log(
  `${voiced.lines} lines in the draft of "${slug}" needed voice: ${voiced.generated} generated with ElevenLabs, the rest reused from storage. Publish the draft to use it.`
)
process.exit(0)

import { audit } from '../common-service/audit/service/index.js'
import { sql } from '../common-service/db/service/index.js'
import { ensureMediaBucket } from '../common-service/storage/service/index.js'
import { audioKey, speechFor, voiceReady } from '../common-service/voice/service/index.js'
import { lessonLines } from '../common-service/voice/utils/index.js'
import { config } from '../config/index.js'
import { createDraftFrom } from '../src/routes/v1/lessons/service/index.js'
import { json } from '../common-service/http/utils/index.js'

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

const [source] = await sql`
  SELECT * FROM lessons WHERE slug = ${slug} AND status IN ('draft', 'published')
  ORDER BY (status = 'draft') DESC LIMIT 1
`
if (!source) {
  console.error(`No draft or published lesson with the slug "${slug}".`)
  process.exit(1)
}

const owner = { id: source.published_by ?? source.created_by }
const draftId = source.status === 'draft' ? source.id : (await sql.begin((tx) => createDraftFrom(tx, owner, source, {}))).id
const [{ content }] = await sql`SELECT content FROM lessons WHERE id = ${draftId}`

const lines = lessonLines(content)
let generated = 0
let reused = 0
for (const line of lines) {
  if (line.audio?.key === audioKey(line.text)) continue
  const { generated: fresh, ...audio } = await speechFor(line.text)
  line.audio = audio
  if (fresh) generated += 1
  else reused += 1
  console.log(`${fresh ? 'generated' : 'reused   '}  ${line.text}`)
}

await sql.begin(async (tx) => {
  await tx`UPDATE lessons SET content = ${json(content)}::jsonb WHERE id = ${draftId} AND status = 'draft'`
  await audit(tx, { actor: owner, action: 'lesson.audio_generated', entityType: 'lesson', entityId: draftId, diff: { lines: lines.length, generated, reused } })
})

console.log(`\n${lines.length} lines in the draft of "${slug}": ${generated} generated with ElevenLabs, ${reused} reused from storage. Publish the draft to use it.`)
process.exit(0)

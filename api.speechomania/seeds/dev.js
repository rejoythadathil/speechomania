import { getAuth } from 'firebase-admin/auth'
import { getApps, initializeApp } from 'firebase-admin/app'
import { sql } from '../common-service/db/index.js'
import { config } from '../config/index.js'
import { json } from '../utils.js'

if (config.APP_ENV !== 'local') {
  console.error('Seeding is only allowed with APP_ENV=local')
  process.exit(1)
}

const PASSWORD = 'speechomania-local-123'
const auth = getAuth(getApps()[0] ?? initializeApp({ projectId: config.FIREBASE_PROJECT_ID }))

const [{ count }] = await sql`SELECT count(*)::int AS count FROM users`
if (count > 0) {
  console.log('Database already has users; skipping seed. Reset with docker compose down -v.')
  process.exit(0)
}

async function firebaseUser(email, fullName) {
  try {
    return (await auth.createUser({ email, password: PASSWORD, displayName: fullName })).uid
  } catch (error) {
    if (error.code !== 'auth/email-already-exists') throw error
    const existing = await auth.getUserByEmail(email)
    await auth.updateUser(existing.uid, { password: PASSWORD, disabled: false })
    return existing.uid
  }
}

let state = 20261025
function random() {
  state = (state * 1103515245 + 12345) % 2147483648
  return state / 2147483648
}
const pick = (list) => list[Math.floor(random() * list.length)]

const staff = [
  ['admin@speechomania.local', 'Anita Menon', 'admin'],
  ['mentor.rahul@speechomania.local', 'Rahul Nair', 'mentor'],
  ['mentor.fathima@speechomania.local', 'Fathima Rasheed', 'mentor'],
  ['mentor.arjun@speechomania.local', 'Arjun Pillai', 'mentor'],
  ['mentor.sneha@speechomania.local', 'Sneha George', 'mentor']
]
const parentNames = ['Priya Varma', 'Joseph Thomas', 'Lakshmi Iyer', 'Deepa Krishnan', 'Imran Khan', 'Meghna Rao', 'Vivek Menon', 'Anjali Das',
  'Suresh Kumar', 'Neha Sharma', 'Rohan Mathew', 'Kavya Reddy', 'Arif Hussain', 'Divya Nair', 'Manoj Varghese', 'Sara Joseph']
const people = [
  ...staff,
  ...parentNames.map((name, index) => [index < 3 ? ['parent.priya@speechomania.local', 'parent.joseph@speechomania.local', 'parent.lakshmi@speechomania.local'][index] : `parent.${name.split(' ')[0].toLowerCase()}@speechomania.local`, name, 'parent'])
]

const ids = {}
for (const [email, fullName, role] of people) {
  const uid = await firebaseUser(email, fullName)
  const [{ id }] = await sql`
    INSERT INTO users (firebase_uid, email, full_name, role, status, created_at)
    VALUES (${uid}, ${email}, ${fullName}, ${role}, 'active', now() - interval '400 days')
    RETURNING id
  `
  ids[email] = id
}

const admin = ids['admin@speechomania.local']
const mentors = staff.filter(([, , role]) => role === 'mentor').map(([email]) => ids[email])
const parents = people.filter(([, , role]) => role === 'parent').map(([email]) => ids[email])

const lessons = [
  ['can-and-cant', 'Can and can’t', ['A bird can fly.', 'A fish can’t walk.', 'Who can fly?'], 'published'],
  ['colours', 'Colours around us', ['This apple is red.', 'The sky is blue.', 'Find something green.'], 'published'],
  ['feelings', 'How do I feel?', ['This face is happy.', 'This face is sad.', 'Show me happy.'], 'published'],
  ['morning-routine', 'My morning routine', ['First, I wake up.', 'Then, I brush my teeth.'], 'draft']
]
const lessonIds = {}
for (const [slug, title, steps, status] of lessons) {
  const [{ id }] = await sql`
    INSERT INTO lessons (slug, version, title, content, status, created_by, published_by, published_at, created_at)
    VALUES (${slug}, 1, ${title}, ${json({ steps: steps.map((text) => ({ text })) })}::jsonb, ${status}, ${admin},
      ${status === 'published' ? admin : null}, CASE WHEN ${status} = 'published' THEN now() - interval '300 days' END, now() - interval '320 days')
    RETURNING id
  `
  lessonIds[slug] = id
}

const childNames = ['Aarav', 'Diya', 'Ethan', 'Meera', 'Vihaan', 'Anika', 'Kabir', 'Zara', 'Reyansh', 'Ira', 'Advik', 'Myra', 'Arjun', 'Saanvi',
  'Ayaan', 'Navya', 'Vivaan', 'Kiara', 'Dhruv', 'Aadhya', 'Ishaan', 'Riya', 'Atharv', 'Anvi', 'Krish', 'Pari', 'Shaurya', 'Tara', 'Rudra',
  'Avni', 'Yuvan', 'Sia', 'Om', 'Mahi', 'Neil', 'Ahana', 'Veer', 'Inaya', 'Laksh', 'Nila']
const childIds = []
for (const [index, name] of childNames.entries()) {
  const daysAgo = Math.floor(Math.pow(random(), 0.85) * 355)
  const mentor = index % 9 === 8 ? null : mentors[Math.floor(Math.pow(random(), 1.4) * mentors.length)]
  const parent = index < 2 ? parents[0] : index === 2 ? parents[1] : index === 3 ? parents[2] : pick(parents)
  const [{ id }] = await sql`
    INSERT INTO children (parent_id, mentor_id, display_name, date_of_birth, sensory_settings, assigned_lessons, consent_version, consent_at, created_at)
    VALUES (${parent}, ${mentor}, ${name}, ${`${2017 + Math.floor(random() * 5)}-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`},
      ${json({ motion: pick(['reduced', 'normal']), sound: pick(['normal', 'quiet']), colour: 'low' })}::jsonb,
      ${json(index % 11 === 5 ? [] : ['can-and-cant', 'colours'].slice(0, 1 + Math.floor(random() * 2)))}::jsonb, 'v1',
      now() - make_interval(days => ${daysAgo}), now() - make_interval(days => ${daysAgo}))
    RETURNING id, mentor_id
  `
  childIds.push({ id, mentor: mentor ?? null, name, daysAgo })
}

const notes = [
  'Calm focus through the whole lesson today.', 'Needed two prompts on the quiz pages; better with quiet sound.',
  'Pointed to the right picture without help for the first time.', 'Short session today; tired after school.',
  'Enjoyed the colours lesson and repeated the words aloud.', 'Ready to move on to the next lesson.',
  'Some frustration with fast audio. Keep the voice speed slow.', 'Great eye contact during the feelings lesson.'
]
const withMentor = childIds.filter((child) => child.mentor)
for (const [index, child] of withMentor.entries()) {
  const quiet = index % 7 === 3 ? 15 + Math.floor(random() * 30) : 0
  for (let daysAgo = Math.min(child.daysAgo, 84); daysAgo > quiet; daysAgo -= 5 + Math.floor(random() * 6)) {
    await sql`
      INSERT INTO remarks (child_id, author_id, body, visibility, seen_at, created_at)
      VALUES (${child.id}, ${child.mentor}, ${pick(notes)}, ${random() < 0.55 ? 'shared' : 'internal'},
        CASE WHEN ${daysAgo} > 2 THEN now() END, now() - make_interval(days => ${daysAgo}, hours => ${Math.floor(random() * 8)}))
    `
  }
}

const actions = ['child.viewed', 'child.viewed', 'child.viewed', 'remark.created', 'child.updated', 'child.lessons_assigned']
for (let day = 0; day < 182; day += 1) {
  const weekday = new Date(Date.now() - day * 86400000).getDay()
  const busy = weekday === 0 ? 0.1 : weekday === 6 ? 0.35 : 1
  const count = Math.floor(random() * 14 * busy * (0.6 + (182 - day) / 300))
  for (let n = 0; n < count; n += 1) {
    const child = pick(withMentor)
    await sql`
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, created_at)
      VALUES (${random() < 0.2 ? admin : child.mentor}, ${pick(actions)}, 'child', ${child.id}, now() - make_interval(days => ${day}, hours => ${Math.floor(random() * 9)}))
    `
  }
}

const requests = [
  ['can-and-cant', mentors[0], 'Two children were confused by the word “can’t” spoken quickly.', 'Add a step that shows “can’t” with a crossed-out picture before the quiz.', 'pending'],
  ['colours', mentors[1], 'Green and blue look alike on the older tablets.', 'Use a brighter green in step three.', 'pending'],
  ['feelings', mentors[2], 'Children wanted to answer, not just watch.', 'Add a “show me happy” step at the end.', 'approved']
]
for (const [slug, mentor, reason, summary, status] of requests) {
  await sql`
    INSERT INTO change_requests (lesson_id, requested_by, reason, proposed_change, status, reviewed_by, reviewed_at, created_at)
    VALUES (${lessonIds[slug]}, ${mentor}, ${reason}, ${json({ summary })}::jsonb, ${status},
      ${status === 'pending' ? null : admin}, CASE WHEN ${status} = 'pending' THEN NULL ELSE now() - interval '3 days' END, now() - interval '6 days')
  `
}

console.log(`Seeded ${people.length} users, ${childIds.length} children, ${lessons.length} lessons, 12 weeks of remarks and 26 weeks of activity.`)
console.log(`All seed accounts use the password: ${PASSWORD}`)
await sql.close()

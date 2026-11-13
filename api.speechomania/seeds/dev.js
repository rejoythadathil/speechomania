import { getAuth } from 'firebase-admin/auth'
import { getApps, initializeApp } from 'firebase-admin/app'
import { db } from '../common-service/db/service/index.js'
import { LESSONS } from './lessons.js'
import { config } from '../config/index.js'
import {
  scoreAttempt,
  snapshotItem,
  withDefaults
} from '../src/routes/v1/assessments/utils/index.js'

const DEMO = process.argv.includes('--demo')
if (config.APP_ENV !== 'local' && !DEMO) {
  console.error('Seeding is only allowed with APP_ENV=local, or with --demo')
  process.exit(1)
}
const tag = DEMO ? { demo: true } : {}

const PASSWORD = 'speechomania-local-123'
const auth = getAuth(getApps()[0] ?? initializeApp({ projectId: config.FIREBASE_PROJECT_ID }))

const seeded = DEMO
  ? await db.users.count({ where: { metadata: { path: ['demo'], equals: true } } })
  : await db.users.count()
if (seeded) {
  console.log('Database already has seed users; skipping seed.')
  process.exit(0)
}
const realAdmin = DEMO
  ? await db.users.findFirst({
      where: { role: 'admin', deleted_at: null },
      orderBy: { created_at: 'asc' },
      select: { id: true }
    })
  : null
if (DEMO && !realAdmin) {
  console.error('--demo needs an existing admin to own lessons and assessments')
  process.exit(1)
}

async function firebaseUser(email, fullName) {
  if (DEMO) return `demo:${email}`
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
const ago = (days, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600000)

const staff = [
  ...(DEMO ? [] : [['admin@speechomania.local', 'Anita Menon', 'admin']]),
  ['mentor.rahul@speechomania.local', 'Rahul Nair', 'mentor'],
  ['mentor.fathima@speechomania.local', 'Fathima Rasheed', 'mentor'],
  ['mentor.arjun@speechomania.local', 'Arjun Pillai', 'mentor'],
  ['mentor.sneha@speechomania.local', 'Sneha George', 'mentor']
]
const parentNames = [
  'Priya Varma',
  'Joseph Thomas',
  'Lakshmi Iyer',
  'Deepa Krishnan',
  'Imran Khan',
  'Meghna Rao',
  'Vivek Menon',
  'Anjali Das',
  'Suresh Kumar',
  'Neha Sharma',
  'Rohan Mathew',
  'Kavya Reddy',
  'Arif Hussain',
  'Divya Nair',
  'Manoj Varghese',
  'Sara Joseph'
]
const people = [
  ...staff,
  ...parentNames.map((name, index) => [
    index < 3
      ? [
          'parent.priya@speechomania.local',
          'parent.joseph@speechomania.local',
          'parent.lakshmi@speechomania.local'
        ][index]
      : `parent.${name.split(' ')[0].toLowerCase()}@speechomania.local`,
    name,
    'parent'
  ])
]

const ids = {}
for (const [email, fullName, role] of people) {
  const uid = await firebaseUser(email, fullName)
  const { id } = await db.users.create({
    data: {
      firebase_uid: uid,
      email,
      full_name: fullName,
      role,
      status: 'active',
      metadata: tag,
      created_at: ago(400)
    },
    select: { id: true }
  })
  ids[email] = id
}

const admin = DEMO ? realAdmin.id : ids['admin@speechomania.local']
const mentors = staff.filter(([, , role]) => role === 'mentor').map(([email]) => ids[email])
const parents = people.filter(([, , role]) => role === 'parent').map(([email]) => ids[email])

const lessons = LESSONS
const games = lessons.filter(([, , , status]) => status === 'published').map(([slug]) => slug)
const lessonIds = {}
for (const [slug, title, content, status] of lessons) {
  const existing = DEMO
    ? await db.lessons.findFirst({ where: { slug }, select: { id: true } })
    : null
  if (existing) {
    lessonIds[slug] = existing.id
    continue
  }
  const published = status === 'published'
  const { id } = await db.lessons.create({
    data: {
      slug,
      version: 1,
      title,
      content,
      status,
      created_by: admin,
      published_by: published ? admin : null,
      published_at: published ? ago(300) : null,
      created_at: ago(320)
    },
    select: { id: true }
  })
  lessonIds[slug] = id
}

const childNames = [
  'Aarav',
  'Diya',
  'Ethan',
  'Meera',
  'Vihaan',
  'Anika',
  'Kabir',
  'Zara',
  'Reyansh',
  'Ira',
  'Advik',
  'Myra',
  'Arjun',
  'Saanvi',
  'Ayaan',
  'Navya',
  'Vivaan',
  'Kiara',
  'Dhruv',
  'Aadhya',
  'Ishaan',
  'Riya',
  'Atharv',
  'Anvi',
  'Krish',
  'Pari',
  'Shaurya',
  'Tara',
  'Rudra',
  'Avni',
  'Yuvan',
  'Sia',
  'Om',
  'Mahi',
  'Neil',
  'Ahana',
  'Veer',
  'Inaya',
  'Laksh',
  'Nila'
]
const childIds = []
for (const [index, name] of childNames.entries()) {
  const daysAgo = Math.floor(Math.pow(random(), 0.85) * 355)
  const mentor =
    index % 9 === 8 ? null : mentors[Math.floor(Math.pow(random(), 1.4) * mentors.length)]
  const parent =
    index < 2 ? parents[0] : index === 2 ? parents[1] : index === 3 ? parents[2] : pick(parents)
  const { id } = await db.children.create({
    data: {
      parent_id: parent,
      mentor_id: mentor,
      display_name: name,
      date_of_birth: new Date(
        `${2017 + Math.floor(random() * 5)}-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}T00:00:00Z`
      ),
      sensory_settings: {
        motion: pick(['reduced', 'normal']),
        sound: pick(['normal', 'quiet']),
        colour: 'low'
      },
      assigned_lessons:
        index < 2 ? games : index % 11 === 5 ? [] : games.slice(0, 1 + Math.floor(random() * 4)),
      consent_version: 'v1',
      consent_at: ago(daysAgo),
      metadata: index === 0 ? { ...tag, guest: true } : tag,
      created_at: ago(daysAgo)
    },
    select: { id: true }
  })
  childIds.push({ id, mentor: mentor ?? null, name, daysAgo })
}

const notes = [
  'Calm focus through the whole lesson today.',
  'Needed two prompts on the quiz pages; better with quiet sound.',
  'Pointed to the right picture without help for the first time.',
  'Short session today; tired after school.',
  'Enjoyed the colours lesson and repeated the words aloud.',
  'Ready to move on to the next lesson.',
  'Some frustration with fast audio. Keep the voice speed slow.',
  'Great eye contact during the feelings lesson.'
]
const withMentor = childIds.filter((child) => child.mentor)
for (const [index, child] of withMentor.entries()) {
  const quiet = index % 7 === 3 ? 15 + Math.floor(random() * 30) : 0
  for (
    let daysAgo = Math.min(child.daysAgo, 84);
    daysAgo > quiet;
    daysAgo -= 5 + Math.floor(random() * 6)
  ) {
    await db.remarks.create({
      data: {
        child_id: child.id,
        author_id: child.mentor,
        body: pick(notes),
        visibility: random() < 0.55 ? 'shared' : 'internal',
        seen_at: daysAgo > 2 ? new Date() : null,
        metadata: tag,
        created_at: ago(daysAgo, Math.floor(random() * 8))
      }
    })
  }
}

const actions = [
  'child.viewed',
  'child.viewed',
  'child.viewed',
  'remark.created',
  'child.updated',
  'child.lessons_assigned'
]
for (let day = 0; day < 182; day += 1) {
  const weekday = new Date(Date.now() - day * 86400000).getDay()
  const busy = weekday === 0 ? 0.1 : weekday === 6 ? 0.35 : 1
  const count = Math.floor(random() * 14 * busy * (0.6 + (182 - day) / 300))
  for (let n = 0; n < count; n += 1) {
    const child = pick(withMentor)
    await db.audit_logs.create({
      data: {
        actor_id: random() < 0.2 ? admin : child.mentor,
        action: pick(actions),
        entity_type: 'child',
        entity_id: child.id,
        metadata: tag,
        created_at: ago(day, Math.floor(random() * 9))
      }
    })
  }
}

const requests = [
  [
    'can-and-cant',
    mentors[0],
    'Two children were confused by the word “can’t” spoken quickly.',
    'Add a step that shows “can’t” with a crossed-out picture before the quiz.',
    'pending'
  ],
  [
    'colours',
    mentors[1],
    'Green and blue look alike on the older tablets.',
    'Use a brighter green in step three.',
    'pending'
  ],
  [
    'feelings',
    mentors[2],
    'Children wanted to answer, not just watch.',
    'Add a “show me happy” step at the end.',
    'approved'
  ]
]
for (const [slug, mentor, reason, summary, status] of requests) {
  const pending = status === 'pending'
  await db.change_requests.create({
    data: {
      lesson_id: lessonIds[slug],
      requested_by: mentor,
      reason,
      proposed_change: { summary },
      status,
      reviewed_by: pending ? null : admin,
      reviewed_at: pending ? null : ago(3),
      metadata: tag,
      created_at: ago(6)
    }
  })
}

const lessonRows = new Map(
  (await db.lessons.findMany({ where: { status: 'published' } })).map((row) => [row.slug, row])
)
let playCount = 0
for (const [index, child] of withMentor.entries()) {
  if (index % 5 === 4) continue
  const { assigned_lessons: assigned } = await db.children.findUnique({
    where: { id: child.id },
    select: { assigned_lessons: true }
  })
  const playable = assigned.map((slug) => lessonRows.get(slug)).filter(Boolean)
  if (!playable.length) continue
  const keen = 0.35 + random() * 0.5
  for (let week = Math.min(11, Math.floor(child.daysAgo / 7)); week >= 0; week -= 1) {
    if (random() > keen) continue
    for (let play = 1 + Math.floor(random() * 3); play > 0; play -= 1) {
      const lesson = pick(playable)
      const steps = lesson.content.steps?.length ?? 1
      const daysAgo = week * 7 + Math.floor(random() * 7)
      await db.attempts.create({
        data: {
          child_id: child.id,
          lesson_id: lesson.id,
          status: 'completed',
          steps_total: steps,
          steps_completed: steps,
          stars: Math.round(steps * (0.5 + random() * 0.5)),
          metadata: tag,
          started_at: ago(daysAgo, 1),
          completed_at: ago(daysAgo)
        }
      })
      playCount += 1
    }
  }
}

const pickItems = (picks) =>
  picks.map(([slug, index, points]) => snapshotItem(lessonRows.get(slug), index, points))
const assessmentPlans = [
  {
    title: 'Term 1 language check-in',
    description:
      'A short mix of describing words, feelings and where things are. Give it once a term.',
    status: 'published',
    settings: {
      scoring: { points: 1, tries: 2, retry_points: 0, pass_percent: 60 },
      play: { shuffle: true, hints: false, retakes: false }
    },
    items: [
      ['describing-words', 0],
      ['describing-words', 6],
      ['feelings', 1],
      ['feelings', 3],
      ['where-is-it', 2],
      ['where-is-it', 9],
      ['a-or-the', 5],
      ['bigger-smaller', 3]
    ]
  },
  {
    title: 'Questions and reasons',
    description: 'Yes or no questions, then why questions. Parents see the score.',
    status: 'published',
    settings: {
      scoring: { points: 2, tries: 3, retry_points: 1, pass_percent: null },
      play: { hints: true },
      collect: { time: false }
    },
    items: [
      ['ask-me', 0],
      ['ask-me', 2],
      ['ask-me', 4],
      ['why', 0],
      ['why', 3, 3],
      ['why', 8, 3]
    ]
  },
  {
    title: 'Short words review (draft)',
    description: 'Still being built.',
    status: 'draft',
    settings: {},
    items: [
      ['short-words', 0],
      ['short-words', 1],
      ['can-and-cant', 2]
    ]
  }
]
let assessmentCount = 0
let attemptCount = 0
for (const [order, plan] of assessmentPlans.entries()) {
  const items = pickItems(plan.items)
  const settings = withDefaults(plan.settings)
  const published = plan.status === 'published'
  const { id } = await db.assessments.create({
    data: {
      title: plan.title,
      description: plan.description,
      status: plan.status,
      settings,
      items,
      created_by: admin,
      published_by: published ? admin : null,
      published_at: published ? ago(40 - order * 10) : null,
      metadata: tag,
      created_at: ago(45 - order * 10)
    },
    select: { id: true }
  })
  assessmentCount += 1
  if (!published) continue
  const takers = [childIds[0], childIds[1], ...withMentor.slice(2, 14)]
  for (const [index, child] of takers.entries()) {
    const current = await db.children.findUnique({
      where: { id: child.id },
      select: { assigned_assessments: true }
    })
    await db.children.update({
      where: { id: child.id },
      data: {
        assigned_assessments: [
          ...current.assigned_assessments,
          {
            assessment_id: id,
            due_on: null,
            assigned_by: child.mentor ?? admin,
            assigned_at: ago(30 - order * 8).toISOString()
          }
        ]
      }
    })
    if (index % 4 === 3) continue
    const events = items.map((item, at) => {
      const correct = random() < 0.72
      const wrongs = correct
        ? random() < 0.75
          ? 0
          : 1
        : Math.min(settings.scoring.tries, 1 + Math.floor(random() * 2))
      return {
        step: 'assess',
        index: at,
        correct,
        ...(settings.collect.tries ? { wrongs } : {}),
        ...(settings.collect.time ? { latency_ms: 2500 + Math.floor(random() * 9000) } : {}),
        points: correct
          ? wrongs
            ? Math.min(settings.scoring.retry_points, item.points ?? settings.scoring.points)
            : (item.points ?? settings.scoring.points)
          : 0
      }
    })
    const finished = index % 5 !== 4
    const daysAgo = 2 + Math.floor(random() * 20)
    await db.attempts.create({
      data: {
        child_id: child.id,
        assessment_id: id,
        status: finished ? 'completed' : 'in_progress',
        steps_total: items.length,
        steps_completed: finished ? items.length : Math.floor(items.length / 2),
        events: finished ? events : events.slice(0, Math.floor(items.length / 2)),
        metadata: finished ? { ...tag, result: scoreAttempt(events, items, settings) } : tag,
        started_at: ago(daysAgo, 1),
        completed_at: finished ? ago(daysAgo) : null
      }
    })
    attemptCount += 1
  }
}

console.log(
  `Seeded ${people.length} users, ${childIds.length} children, ${lessons.length} lessons, ${assessmentCount} assessments with ${attemptCount} attempts, ${playCount} game plays over 12 weeks, 12 weeks of remarks and 26 weeks of activity.`
)
console.log(
  DEMO
    ? 'Demo people have no sign-in. Remove everything tagged demo with bun seeds/demo-remove.js.'
    : `All seed accounts use the password: ${PASSWORD}`
)
await db.$disconnect()

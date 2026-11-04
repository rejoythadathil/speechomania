import { getAuth } from 'firebase-admin/auth'
import { getApps, initializeApp } from 'firebase-admin/app'
import { db } from '../common-service/db/service/index.js'
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

const line = (text) => ({ text })
const cant = 'can’t'
const canAndCant = {
  player: 'pick',
  contrast: cant,
  lines: {
    intro: line('Let’s read together.'),
    quiz: line('Now, show me.'),
    retry: line('Let’s look again.'),
    skip: line('Let’s try another.'),
    outro: line('The end. Great reading!'),
    reward: line('You earned a sticker!')
  },
  steps: [
    ['swim', 'baby', 'swimmer', 'swim'],
    ['walk', 'snake', 'dog', 'walk'],
    ['fly', 'snake', 'bird', 'fly'],
    ['bark', 'cat', 'dog', 'bark'],
    ['climb a tree', 'lion', 'monkey', 'climb'],
    ['ride a bike', 'cat', 'boy', 'ride'],
    ['see in the morning', 'bat', 'swimmer', 'morning'],
    ['sing', 'lion', 'bird', 'sing'],
    ['go to school', 'monkey', 'toddler', 'school'],
    ['roar', 'monkey', 'lion', 'roar']
  ].map(([verb, cannot, can, act], index) => ({
    text: `Who ${cant} ${verb}?`,
    choices: index % 2 ? [can, cannot] : [cannot, can],
    answer: cannot,
    actor: can,
    act,
    praise: line(`Yes! The ${cannot} ${cant} ${verb}.`),
    teach: line(`The ${cannot} ${cant} ${verb}. The ${can} can ${verb}.`)
  }))
}
const play = {
  retry: line('Let’s look again.'),
  yes: line('Yes!'),
  outro: line('You did it!'),
  reward: line('You earned a trophy!')
}
const cap = (text) => `${text[0].toUpperCase()}${text.slice(1)}`
const others = (list, index, count) =>
  Array.from({ length: count }, (_, step) => list[(index + 1 + step * 3) % list.length])

const verbs = [
  ['running', 'running'],
  ['swimming', 'swimming'],
  ['dancing', 'dancing'],
  ['cooking', 'cooking'],
  ['sleeping', 'bed'],
  ['walking', 'walking'],
  ['writing', 'writing'],
  ['clapping', 'clapping'],
  ['hugging', 'hugging'],
  ['riding', 'riding'],
  ['singing', 'singing'],
  ['climbing', 'climbing'],
  ['painting', 'painting'],
  ['juggling', 'juggling'],
  ['surfing', 'surfing']
]
const actionWords = {
  player: 'shark',
  rounds: 8,
  lines: { ...play, intro: line('The shark is hungry. Feed it the right fish.') },
  steps: verbs.map(([word, art]) => ({
    text: `Feed me ${word}!`,
    word,
    art: [art],
    praise: line(`Yum! ${cap(word)}!`)
  }))
}

const moods = [
  ['happy', 'smiling'],
  ['sad', 'sad'],
  ['angry', 'angry'],
  ['scared', 'scared'],
  ['surprised', 'surprised'],
  ['crying', 'crying'],
  ['laughing', 'laughing'],
  ['nervous', 'nervous'],
  ['thinking', 'thinking'],
  ['sleepy', 'sleepy']
]
const feelings = {
  player: 'balloons',
  rounds: 6,
  lines: { ...play, intro: line('Pop the balloon with the right face.') },
  steps: moods.map(([word, art]) => ({
    text: `Pop the ${word} face!`,
    word,
    art: [art],
    praise: line(`Pop! That face is ${word}.`)
  }))
}

const things = [
  ['hot', 'fire', 'The fire is hot.'],
  ['cold', 'ice', 'The ice is cold.'],
  ['wet', 'umbrella', 'The umbrella is wet.'],
  ['soft', 'teddy', 'The teddy is soft.'],
  ['sharp', 'scissors', 'The scissors are sharp.'],
  ['sweet', 'candy', 'The candy is sweet.'],
  ['sour', 'lemon', 'The lemon is sour.'],
  ['loud', 'loud', 'The speaker is loud.'],
  ['fast', 'rocket', 'The rocket is fast.'],
  ['slow', 'snail', 'The snail is slow.'],
  ['tiny', 'ant', 'The ant is tiny.'],
  ['shiny', 'glowing-star', 'The star is shiny.']
]
const describingWords = {
  player: 'bubbles',
  rounds: 6,
  lines: { ...play, intro: line('Look at the picture. Pop the word that fits.') },
  steps: things.map(([word, art, sentence], index) => ({
    text: 'Which word fits the picture?',
    art: [art],
    choices: [word, ...others(things, index, 2).map((item) => item[0])],
    answer: word,
    sentence: line(sentence)
  }))
}

const pairs = [
  ['hot', 'cold', 'hot', 'cold'],
  ['big', 'small', 'elephant', 'mouse'],
  ['fast', 'slow', 'rocket', 'snail'],
  ['open', 'closed', 'open', 'locked'],
  ['day', 'night', 'sun', 'moon'],
  ['full', 'empty', 'full', 'empty'],
  ['old', 'young', 'old-man', 'baby'],
  ['up', 'down', 'up', 'down'],
  ['sweet', 'sour', 'candy', 'lemon'],
  ['healthy', 'sick', 'strong', 'sick']
]
const opposites = {
  player: 'match',
  rounds: 2,
  lines: {
    ...play,
    intro: line('Turn two cards. Find the opposites.'),
    quiz: line('Find the opposites.')
  },
  steps: pairs.map(([first, second, one, two]) => ({
    text: `${cap(first)} and ${second}.`,
    first,
    second,
    art: [one, two],
    praise: line(`${cap(first)} and ${second} are opposites!`)
  }))
}

const contractions = [
  ['do', 'not', 'don’t', 'Don’t touch the fire.', ['raised-hand', 'fire']],
  ['I', 'am', 'I’m', 'I’m jumping.', ['cartwheel']],
  ['can', 'not', 'can’t', 'The duck can’t climb.', ['duck', 'ladder']],
  ['is', 'not', 'isn’t', 'He isn’t awake.', ['bed']],
  ['we', 'are', 'we’re', 'We’re running.', ['running', 'runner-girl']],
  ['will', 'not', 'won’t', 'He won’t eat broccoli.', ['broccoli']],
  ['they', 'are', 'they’re', 'They’re playing.', ['football', 'basketball']],
  ['it', 'is', 'it’s', 'It’s raining.', ['rain']],
  ['he', 'is', 'he’s', 'He’s eating.', ['spaghetti']],
  ['she', 'is', 'she’s', 'She’s painting.', ['painting']]
]
const shortWords = {
  player: 'squish',
  rounds: 6,
  lines: { ...play, intro: line('Squish two words into one short word.') },
  steps: contractions.map(([first, second, word, sentence, art], index) => ({
    text: `Squish ${first} ${second} into one word.`,
    first,
    second,
    art,
    choices: [word, ...others(contractions, index, 2).map((item) => item[2])],
    answer: word,
    sentence: line(sentence)
  }))
}

const comparisons = [
  ['Who is taller?', 'giraffe', 'giraffe', 'boy', 'boy', 'The giraffe is taller than the boy.'],
  [
    'Which ball is bigger?',
    'football',
    'football',
    'tennis ball',
    'tennis-ball',
    'The football is bigger than the tennis ball.'
  ],
  ['Who is smaller?', 'ant', 'ant', 'cat', 'cat', 'The ant is smaller than the cat.'],
  [
    'Who is faster?',
    'leopard',
    'leopard',
    'turtle',
    'turtle',
    'The leopard is faster than the turtle.'
  ],
  ['Who is slower?', 'snail', 'snail', 'rabbit', 'rabbit', 'The snail is slower than the rabbit.'],
  ['Which is heavier?', 'rock', 'rock', 'leaf', 'leaf', 'The rock is heavier than the leaf.'],
  [
    'Which is lighter?',
    'feather',
    'feather',
    'books',
    'books',
    'The feather is lighter than the books.'
  ],
  ['Which is hotter?', 'fire', 'fire', 'ice', 'ice', 'The fire is hotter than the ice.'],
  [
    'Which is colder?',
    'ice cream',
    'ice-cream',
    'coffee',
    'coffee',
    'The ice cream is colder than the coffee.'
  ],
  [
    'Who is bigger?',
    'elephant',
    'elephant',
    'mouse',
    'mouse',
    'The elephant is bigger than the mouse.'
  ]
]
const biggerSmaller = {
  player: 'compare',
  rounds: 6,
  lines: { ...play, intro: line('Look at both. Tap the one that fits.') },
  steps: comparisons.map(([text, answer, answerArt, other, otherArt, sentence], index) => ({
    text,
    choices: index % 2 ? [other, answer] : [answer, other],
    art: index % 2 ? [otherArt, answerArt] : [answerArt, otherArt],
    answer,
    sentence: line(sentence)
  }))
}

const places = [
  ['cat', 'box', 'in', ['on', 'under']],
  ['cat', 'box', 'on', ['in', 'beside']],
  ['cat', 'box', 'under', ['on', 'beside']],
  ['dog', 'house', 'beside', ['on', 'behind']],
  ['dog', 'house', 'behind', ['beside', 'on']],
  ['duck', 'chair', 'on', ['under', 'beside']],
  ['mouse', 'chair', 'under', ['on', 'beside']],
  ['ball', 'box', 'in', ['beside', 'on']],
  ['bird', 'tree', 'in', ['under', 'beside']],
  ['rabbit', 'tree', 'in front of', ['behind', 'on']]
]
const placeArt = { ball: 'football', box: 'box' }
const whereIsIt = {
  player: 'place',
  rounds: 6,
  lines: { ...play, intro: line('Listen, then put it in the right spot.') },
  steps: places.map(([thing, spot, answer, wrong]) => ({
    text: `Put the ${thing} ${answer} the ${spot}.`,
    art: [placeArt[thing] ?? thing, placeArt[spot] ?? spot],
    choices: [answer, ...wrong],
    answer,
    sentence: line(`The ${thing} is ${answer} the ${spot}.`)
  }))
}

const gaps = [
  ['I see … dog.', 'a', 'dog'],
  ['Look at … dog.', 'the', 'dog'],
  ['I want … cookie.', 'a', 'cookie'],
  ['… cookie is big.', 'the', 'cookie'],
  ['Open … door.', 'the', 'door'],
  ['I have … apple.', 'an', 'apple'],
  ['… sun is hot.', 'the', 'sun'],
  ['I saw … shooting star.', 'a', 'shooting-star'],
  ['Throw … ball.', 'the', 'basketball'],
  ['I ride … horse.', 'a', 'horse']
]
const fill = (text, word) => text.replace('…', text.startsWith('…') ? cap(word) : word)
const aOrThe = {
  player: 'train',
  rounds: 6,
  lines: { ...play, intro: line('Load the right word on the train.') },
  steps: gaps.map(([text, answer, art]) => ({
    text,
    art: [art],
    choices: answer === 'an' ? ['a', 'an', 'the'] : ['a', 'the'],
    answer,
    sentence: line(fill(text, answer))
  }))
}

const questions = [
  ['book', 'closed-book', true],
  ['pen', 'pen', true],
  ['table', 'chair', false, 'No. This is a chair.'],
  ['nose', 'nose', true],
  ['cat', 'dog', false, 'No. This is a dog.'],
  ['shirt', 't-shirt', true],
  ['ball', 'cricket', false, 'No. This is a bat.'],
  ['house', 'house', true],
  ['mountain', 'mountain', true],
  ['spoon', 'knife', false, 'No. This is a knife.'],
  ['horse', 'horse', true],
  ['duck', 'duck', true],
  ['frog', 'rabbit', false, 'No. This is a rabbit.'],
  ['apple', 'apple', true],
  ['car', 'toy-car', true],
  ['fish', 'bird', false, 'No. This is a bird.']
]
const askMe = {
  player: 'yesno',
  rounds: 8,
  lines: { ...play, intro: line('Look and listen. Say yes or no.') },
  steps: questions.map(([thing, art, answer, no]) => ({
    text: `Is this a ${thing}?`,
    art: [art],
    answer,
    sentence: line(answer ? `Yes. This is a ${thing}.` : no)
  }))
}

const reasons = [
  [
    'Why is she holding an umbrella?',
    ['umbrella', 'rain'],
    'it is raining',
    'it is her birthday',
    'She is holding an umbrella because it is raining.'
  ],
  [
    'Why is he covering his ears?',
    ['firecracker'],
    'the firecracker is loud',
    'he is hungry',
    'He is covering his ears because the firecracker is loud.'
  ],
  [
    'Why do we brush our teeth?',
    ['toothbrush'],
    'to keep them clean',
    'to make them sleepy',
    'We brush our teeth to keep them clean.'
  ],
  [
    'Why do we take a bath?',
    ['bath', 'soap'],
    'to keep our body clean',
    'to go to school',
    'We take a bath to keep our body clean.'
  ],
  [
    'Why is he saving money?',
    ['money', 'toy-car'],
    'to buy a toy car',
    'to wash his hands',
    'He is saving money to buy a toy car.'
  ],
  [
    'Why is she giving a present?',
    ['gift', 'cake'],
    'it is a birthday',
    'it is raining',
    'She is giving a present because it is a birthday.'
  ],
  [
    'Why does he have a bandage?',
    ['bandage'],
    'he hurt his knee',
    'he is happy',
    'He has a bandage because he hurt his knee.'
  ],
  [
    'Why is she combing her hair?',
    ['comb', 'girl'],
    'to untangle it',
    'to make it wet',
    'She is combing her hair to untangle it.'
  ],
  [
    'Why is he sleeping?',
    ['sleeping'],
    'he is tired',
    'he is running',
    'He is sleeping because he is tired.'
  ],
  [
    'Why do we wash our hands?',
    ['soap', 'droplet'],
    'to clean the germs',
    'to make them dirty',
    'We wash our hands to clean the germs.'
  ],
  [
    'Why do we water the plant?',
    ['plant', 'droplet'],
    'so it can grow',
    'so it can walk',
    'We water the plant so it can grow.'
  ],
  [
    'Why do we use a dustbin?',
    ['wastebasket'],
    'to keep the place clean',
    'to play a game',
    'We use a dustbin to keep the place clean.'
  ],
  ['Why do we go to school?', ['school'], 'to learn', 'to sleep', 'We go to school to learn.'],
  ['Why do we use a chair?', ['chair'], 'to sit', 'to cook', 'We use a chair to sit.']
]
const why = {
  player: 'why',
  rounds: 6,
  lines: { ...play, intro: line('Be a detective. Find the reason.') },
  steps: reasons.map(([text, art, answer, other, sentence], index) => ({
    text,
    art,
    choices: index % 2 ? [other, answer] : [answer, other],
    answer,
    sentence: line(sentence)
  }))
}

const story = (...pages) => ({
  player: 'story',
  lines: { outro: line('The end. Great reading!') },
  steps: pages.map(([text, art]) => ({ text, art: [art] }))
})
const lessons = [
  ['can-and-cant', 'Can and can’t', canAndCant, 'published'],
  ['action-words', 'Action words', actionWords, 'published'],
  ['feelings', 'Feelings', feelings, 'published'],
  ['describing-words', 'Describing words', describingWords, 'published'],
  ['opposites', 'Opposites', opposites, 'published'],
  ['short-words', 'Short words', shortWords, 'published'],
  ['bigger-smaller', 'Bigger and smaller', biggerSmaller, 'published'],
  ['where-is-it', 'Where is it?', whereIsIt, 'published'],
  ['a-or-the', 'A or the', aOrThe, 'published'],
  ['ask-me', 'Ask me', askMe, 'published'],
  ['why', 'Why?', why, 'published'],
  [
    'colours',
    'Colours around us',
    story(
      ['This apple is red.', 'apple'],
      ['This heart is blue.', 'blue-heart'],
      ['This frog is green.', 'frog'],
      ['This banana is yellow.', 'banana']
    ),
    'published'
  ],
  [
    'morning-routine',
    'My morning routine',
    story(['First, I wake up.', 'sunrise'], ['Then, I brush my teeth.', 'toothbrush']),
    'draft'
  ]
]
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
      metadata: tag,
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
  `Seeded ${people.length} users, ${childIds.length} children, ${lessons.length} lessons, ${assessmentCount} assessments with ${attemptCount} attempts, 12 weeks of remarks and 26 weeks of activity.`
)
console.log(
  DEMO
    ? 'Demo people have no sign-in. Remove everything tagged demo with bun seeds/demo-remove.js.'
    : `All seed accounts use the password: ${PASSWORD}`
)
await db.$disconnect()

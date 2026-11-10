import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { call, makeChild, makeUser } from '../../../../../test/helpers.js'
import { FRIENDS, STARS_PER_FRIEND } from '../../learning/constants/index.js'
import { exampleOf, pickGames, skillOf, totals } from '../utils/index.js'

const tag = crypto.randomUUID().slice(0, 6)
const steps = (n, text = 'Step') =>
  Array.from({ length: n }, (_, i) => ({ text: `${text} ${i + 1}` }))

let admin

async function lesson(slug, title, content, status = 'published') {
  return db.lessons.create({
    data: {
      slug,
      version: 1,
      title,
      content,
      status,
      created_by: admin.id,
      ...(status === 'published' ? { published_by: admin.id, published_at: new Date() } : {})
    }
  })
}

beforeAll(async () => {
  admin = await makeUser('admin')
  const parent = await makeUser('parent')
  await makeChild(parent, admin, null)
  await lesson(`${tag}-a-cards`, `${tag} Alpha, part 1: flashcards`, {
    player: 'cards',
    steps: steps(15, 'Alpha card')
  })
  await lesson(`${tag}-a`, `${tag} Alpha, part 2: Word train`, {
    player: 'train',
    after: `${tag}-a-cards`,
    steps: steps(15)
  })
  await lesson(`${tag}-b`, `${tag} Beta, part 2: Word train`, { player: 'train', steps: steps(15) })
  await lesson(`${tag}-c`, `${tag} Gamma`, {
    player: 'yesno',
    steps: [{ text: 'Is this a cat?', sentence: { text: 'Yes, this is a cat.' } }, ...steps(14)]
  })
  await lesson(`${tag}-d`, `${tag} Draft only`, { player: 'shark', steps: steps(15) }, 'draft')
})

const mine = (items) => items.filter((item) => item.slug.startsWith(tag))

describe('showcase', () => {
  test('summary needs no sign-in and carries the real reward rules', async () => {
    const { status, body } = await call(null, 'GET', '/showcase')
    expect(status).toBe(200)
    expect(body.games).toBeGreaterThanOrEqual(3)
    expect(body.flashcards).toBeGreaterThanOrEqual(15)
    expect(body.stars_per_friend).toBe(STARS_PER_FRIEND)
    expect(body.friends).toEqual(FRIENDS)
    expect(Object.keys(body).sort()).toEqual(
      ['flashcards', 'friends', 'games', 'medal_share', 'stars_per_friend', 'trophy_share'].sort()
    )
  })

  test('games need no sign-in, show one published game per type in the asked order', async () => {
    const { status, body } = await call(null, 'GET', '/showcase/games', undefined, {
      players: 'yesno,train,shark',
      page_size: 100
    })
    expect(status).toBe(200)
    expect(body.items.map((item) => item.player)).toEqual(
      body.items.map((item) => item.player).filter((p, i, all) => all.indexOf(p) === i)
    )
    expect(body.items.every((item) => ['yesno', 'train', 'shark'].includes(item.player))).toBe(true)
    const train = body.items.find((item) => item.player === 'train')
    const yesno = body.items.find((item) => item.player === 'yesno')
    expect(body.items.indexOf(yesno)).toBeLessThan(body.items.indexOf(train))
    expect(mine(body.items).map((item) => item.slug)).not.toContain(`${tag}-d`)
  })

  test('games expose only public lesson fields', async () => {
    const { body } = await call(null, 'GET', '/showcase/games', undefined, { page_size: 100 })
    expect(body.total).toBe(body.items.length)
    for (const item of body.items) {
      expect(Object.keys(item).sort()).toEqual(['example', 'player', 'skill', 'slug'])
      expect(item.player).not.toBe('cards')
    }
  })

  test('games are paginated and reject unknown game types', async () => {
    const page = await call(null, 'GET', '/showcase/games', undefined, { page_size: 1 })
    expect(page.body.items).toHaveLength(1)
    expect(page.body.page_size).toBe(1)
    const bad = await call(null, 'GET', '/showcase/games', undefined, { players: 'shark,nope' })
    expect(bad.status).toBe(400)
  })
})

describe('showcase rules', () => {
  const lessons = [
    {
      slug: 'b-game',
      title: 'Beta, part 2: Word train',
      content: { player: 'train', steps: [{ text: 'b' }] }
    },
    {
      slug: 'a-game',
      title: 'Alpha, part 2: Word train',
      content: { player: 'train', steps: [{ text: 'a' }] }
    },
    {
      slug: 'a-game-cards',
      title: 'Alpha, part 1: flashcards',
      content: {
        player: 'cards',
        steps: [{ text: 'I see a dog.', art: ['dog'], keys: ['a'] }, { text: 'x' }]
      }
    },
    {
      slug: 'story',
      title: 'Colours around us',
      content: { player: 'story', steps: [{ text: 'This apple is red.' }] }
    }
  ]

  test('skillOf drops the part and game name', () => {
    expect(skillOf('Action words, part 2: Feed the shark')).toBe('Action words')
    expect(skillOf('Colours around us')).toBe('Colours around us')
  })

  test('pickGames keeps the first lesson per game type and follows the asked order', () => {
    expect(pickGames(lessons).map((g) => g.slug)).toEqual(['a-game', 'story'])
    expect(pickGames(lessons, ['story', 'train']).map((g) => g.player)).toEqual(['story', 'train'])
    expect(pickGames(lessons, ['shark'])).toEqual([])
  })

  test('exampleOf carries the card art, key words and layout', () => {
    expect(exampleOf(lessons[1], lessons[2])).toEqual({
      text: 'I see a dog.',
      art: ['dog'],
      keys: ['a'],
      layout: 'row'
    })
  })

  test('exampleOf prefers the first flashcard, then a step sentence, then a step', () => {
    expect(exampleOf(lessons[1], lessons[2]).text).toBe('I see a dog.')
    expect(
      exampleOf({ content: { steps: [{ text: 'Q?', art: ['cat'], sentence: { text: 'A.' } }] } })
    ).toEqual({
      text: 'A.',
      art: ['cat'],
      keys: [],
      layout: 'row'
    })
    expect(exampleOf(lessons[3]).text).toBe('This apple is red.')
  })

  test('totals counts games and flashcards', () => {
    expect(totals(lessons)).toEqual({ games: 3, flashcards: 2 })
  })
})

import { db } from '../../../../../common-service/db/service/index.js'
import { pageArray } from '../../../../../common-service/http/utils/index.js'
import { signAudio } from '../../../../../common-service/voice/service/index.js'
import {
  BADGE_SHARE,
  FRIENDS,
  MEDAL_SHARE,
  STARS_PER_FRIEND
} from '../../learning/constants/index.js'
import { checkOf, learnCards } from '../../lessons/utils/index.js'
import { FREE_GAMES } from '../constants/index.js'
import { freeGameNotFound } from '../exception/index.js'
import { pickGames, skillOf, totals } from '../utils/index.js'

const published = () =>
  db.lessons.findMany({
    where: { status: 'published' },
    select: { slug: true, title: true, content: true }
  })

export async function summary() {
  return {
    ...totals(await published()),
    stars_per_friend: STARS_PER_FRIEND,
    medal_share: MEDAL_SHARE,
    trophy_share: BADGE_SHARE,
    friends: FRIENDS
  }
}

export async function games({ players, ...window }) {
  return pageArray(pickGames(await published(), players), window)
}

export async function freeGames(window) {
  const lessons = await db.lessons.findMany({
    where: { status: 'published', slug: { in: FREE_GAMES } },
    select: { slug: true, title: true, content: true }
  })
  const bySlug = new Map(lessons.map((lesson) => [lesson.slug.toLowerCase(), lesson]))
  const items = FREE_GAMES.filter((slug) => bySlug.has(slug)).map((slug) => {
    const lesson = bySlug.get(slug)
    return { slug, skill: skillOf(lesson.title), player: lesson.content.player }
  })
  return pageArray(items, window)
}

export async function freeGame(slug) {
  if (!FREE_GAMES.includes(slug.toLowerCase())) throw freeGameNotFound()
  const lesson = await db.lessons.findFirst({
    where: { status: 'published', slug },
    select: { slug: true, title: true, content: true, metadata: true }
  })
  if (!lesson) throw freeGameNotFound()
  const { metadata, ...rest } = lesson
  const cards = learnCards(rest.content)
  signAudio(rest.content)
  return { ...rest, cards, check: checkOf(metadata) }
}

import { longDate, wordsOf } from '../../../../../common-service/reports/utils/index.js'
import { LESSON_LEVELS } from '../../lessons/constants/index.js'
import {
  BAR_WIDTH,
  CARD_COLOURS,
  CARD_PICTURE,
  CARDS_PER_PAGE,
  LEVEL_COLOURS,
  MAX_REMARKS,
  NO_LEVEL,
  PLACE_SPOTS,
  SPOT_OVERRIDES
} from '../constants/index.js'

const bar = (done, total, width = BAR_WIDTH) =>
  Math.round(total ? Math.min(1, done / total) * width : 0)

function checkResult(row) {
  if (row.status !== 'completed') return '—'
  if (row.score_hidden) return 'Seen by the mentor'
  const latest = row.latest ?? {}
  return `${latest.score} of ${latest.max_score} (${latest.percent}%)`
}

const levelOf = (level) =>
  LEVEL_COLOURS[level] ? { name: wordsOf(level), colour: LEVEL_COLOURS[level] } : NO_LEVEL

function gameGroups(lessons) {
  const order = [...LESSON_LEVELS, null]
  return order
    .map((level) => {
      const games = lessons.filter(
        (lesson) => (LEVEL_COLOURS[lesson.level] ? lesson.level : null) === level
      )
      return {
        ...levelOf(level),
        games: games.map((lesson) => ({
          title: lesson.title,
          times: lesson.times_completed
            ? `${lesson.times_completed} ${lesson.times_completed === 1 ? 'time' : 'times'}`
            : 'Not yet',
          stars: lesson.times_completed ? `${lesson.best_stars} of ${lesson.max_stars}` : '—',
          bar: lesson.times_completed ? bar(lesson.best_stars, lesson.max_stars, 90) : 0
        }))
      }
    })
    .filter((group) => group.games.length)
}

export function progressData({ learner, lessons, assessments, remarks, parentName, today }) {
  const day = longDate(today)
  return {
    child: { name: learner.display_name },
    parent: { name: parentName },
    today: day,
    watermark: `Prepared for ${parentName} · ${day}`,
    stars: learner.stars,
    played: learner.games_played,
    total: learner.games_total,
    trophies: learner.trophies.length,
    levels: learner.levels.map((level) => ({
      ...levelOf(level.level),
      played: level.played,
      total: level.total,
      bar: bar(level.played, level.total)
    })),
    groups: gameGroups(lessons),
    assessments: assessments.map((row) => ({
      title: row.title,
      status: wordsOf(row.status),
      result: checkResult(row)
    })),
    remarks: remarks.slice(0, MAX_REMARKS).map((remark) => ({
      date: longDate(remark.created_at),
      author: remark.author_name,
      body: remark.body
    }))
  }
}

const bare = (word) => word.toLowerCase().replace(/[^a-z’']/g, '')

export function cardWords(step) {
  const keys = (step.keys ?? []).map((key) => key.toLowerCase())
  return step.text.split(/\s+/).flatMap((word, index, words) => {
    const at = keys.indexOf(bare(word))
    const space = index < words.length - 1 ? ' ' : ''
    if (at < 0) return [{ text: `${word}${space}` }]
    const [, core, tail] = word.match(/^(.*?)([.,!?]*)$/)
    const colour = CARD_COLOURS[step.colours?.[at]] ?? CARD_COLOURS.blue
    return [{ text: core, colour, key: true }, { text: `${tail}${space}` }].filter(
      (part) => part.text
    )
  })
}

export function placePictures(layout, [thing, spot], size = CARD_PICTURE) {
  const place = { ...PLACE_SPOTS[layout], ...SPOT_OVERRIDES[spot]?.[layout] }
  const width = Math.round(place.width * size)
  const thingAt = {
    name: thing,
    x: Math.round(place.left * size - width / 2),
    y: Math.round(place.top * size - width / 2),
    width
  }
  const spotAt = { name: spot, x: 0, y: 0, width: size }
  const left = Math.min(0, thingAt.x)
  const top = Math.min(0, thingAt.y)
  const right = Math.max(size, thingAt.x + width)
  const bottom = Math.max(size, thingAt.y + width)
  const shift = (picture) => ({ ...picture, x: picture.x - left, y: picture.y - top })
  const order = layout === 'behind' ? [thingAt, spotAt] : [spotAt, thingAt]
  return { width: right - left, height: bottom - top, pictures: order.map(shift) }
}

export function rowPictures(art, sizes = [], size = CARD_PICTURE) {
  const count = Math.max(art.length, 1)
  const gap = 10
  const base = Math.min(size, Math.floor((210 - gap * (count - 1)) / count))
  const widths = art.map((_, index) => Math.round(base * Math.min(sizes[index] ?? 1, 1.2)))
  const height = Math.max(...widths, 0)
  let x = 0
  const pictures = art.map((name, index) => {
    const picture = { name, x, y: height - widths[index], width: widths[index] }
    x += widths[index] + gap
    return picture
  })
  return { width: Math.max(0, x - gap), height, pictures }
}

export const CARD_TIPS = [
  'Cut along the dashed lines. Thick paper or card lasts longest.',
  'Read each sentence together and point to the picture as you say it.',
  'The coloured words are the ones to practise. Say them a little slower.',
  'Use a few cards at a time, then play the game in the app.'
]

function cardBox(step, hasArt) {
  const art = (step.art ?? []).filter(hasArt)
  const layout = step.layout ?? 'row'
  if (layout !== 'row' && PLACE_SPOTS[layout] && art.length === 2 && art[0] === step.art[0])
    return placePictures(layout, art)
  return rowPictures(art, step.sizes)
}

export function cardsData({ learner, lesson, parentName, today, hasArt }) {
  const day = longDate(today)
  const cards = (lesson.content.steps ?? [])
    .filter((step) => step.text)
    .map((step, index) => ({
      number: index + 1,
      words: cardWords(step),
      box: cardBox(step, hasArt)
    }))
  const rows = []
  for (let index = 0; index < cards.length; index += 2)
    rows.push([cards[index], cards[index + 1] ?? null])
  const pages = []
  for (let index = 0; index < rows.length; index += CARDS_PER_PAGE / 2)
    pages.push(rows.slice(index, index + CARDS_PER_PAGE / 2))
  return {
    child: { name: learner.display_name },
    parent: { name: parentName },
    lesson: { title: lesson.title.replace(/,\s*part 1: flashcards$/i, '') },
    today: day,
    watermark: `Prepared for ${parentName} · ${day}`,
    tips: CARD_TIPS,
    cards,
    pages,
    index: cards.map((card) => ({
      art: card.box.pictures.at(-1)?.name ?? null,
      word: card.words.find((word) => word.key)?.text ?? null
    })),
    art: [...new Set(cards.flatMap((card) => card.box.pictures.map((picture) => picture.name)))]
  }
}

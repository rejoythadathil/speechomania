export const skillOf = (title) => title.split(/, part \d+: /)[0]

export function exampleOf(lesson, cards) {
  const card = cards?.content?.steps?.[0]
  if (card?.text) {
    return {
      text: card.text,
      art: card.art ?? [],
      keys: card.keys ?? [],
      layout: card.layout ?? 'row'
    }
  }
  const steps = lesson.content?.steps ?? []
  const step = steps.find((item) => item.sentence) ?? steps[0]
  if (!step) return null
  return { text: step.sentence?.text ?? step.text, art: step.art ?? [], keys: [], layout: 'row' }
}

const isGame = (lesson) => Boolean(lesson.content?.player) && lesson.content.player !== 'cards'

export function pickGames(lessons, players) {
  const bySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]))
  const first = new Map()
  for (const lesson of [...lessons].sort((a, b) => a.slug.localeCompare(b.slug))) {
    if (!isGame(lesson) || first.has(lesson.content.player)) continue
    first.set(lesson.content.player, lesson)
  }
  const order = players?.length ? players : [...first.keys()]
  return order
    .filter((player) => first.has(player))
    .map((player) => {
      const lesson = first.get(player)
      return {
        slug: lesson.slug,
        skill: skillOf(lesson.title),
        player,
        example: exampleOf(lesson, bySlug.get(`${lesson.slug}-cards`))
      }
    })
}

export function totals(lessons) {
  return {
    games: lessons.filter(isGame).length,
    flashcards: lessons
      .filter((lesson) => lesson.content?.player === 'cards')
      .reduce((sum, lesson) => sum + (lesson.content.steps?.length ?? 0), 0)
  }
}

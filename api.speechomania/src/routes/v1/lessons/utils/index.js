import { CHECK_QUESTIONS } from '../constants/index.js'

export const stepCount = (content) => content?.steps?.length ?? 0

export const assignedSlugs = (children) => [
  ...new Set(children.flatMap((child) => child.assigned_lessons ?? []))
]

export function lessonView({ creator, publisher, ...lesson }) {
  return {
    ...lesson,
    step_count: stepCount(lesson.content),
    cards: learnCards(lesson.content),
    check: checkOf(lesson.metadata),
    created_by_name: creator.full_name,
    published_by_name: publisher?.full_name ?? null
  }
}

export function versionSummary(counts, slug) {
  const rows = counts.filter((row) => row.slug === slug)
  return {
    version_count: rows.reduce((sum, row) => sum + row._count._all, 0),
    has_draft: rows.some((row) => row.status === 'draft')
  }
}

const cardLine = (player, step) => {
  if (player === 'pick') return step.teach
  if (player === 'match') return step.praise
  return step.sentence ?? step.praise
}

const cardArt = (player, step) => (player === 'pick' ? [step.answer, step.actor] : (step.art ?? []))

const cardKeys = (player, step) => {
  if (player === 'pick') return ['can’t', 'can']
  if (player === 'match') return [step.first, step.second]
  if (player === 'yesno') return []
  return [step.answer ?? step.word].filter((key) => typeof key === 'string')
}

export function learnCards(content) {
  const player = content?.player ?? 'story'
  if (player === 'story') return []
  return (content.steps ?? []).flatMap((step) => {
    const line = cardLine(player, step)
    if (!line?.text) return []
    return [
      {
        text: line.text,
        audio: line.audio ?? null,
        art: cardArt(player, step),
        keys: cardKeys(player, step)
      }
    ]
  })
}

export const checkOf = (metadata) =>
  metadata?.check?.enabled ? { questions: metadata.check.questions ?? CHECK_QUESTIONS } : null

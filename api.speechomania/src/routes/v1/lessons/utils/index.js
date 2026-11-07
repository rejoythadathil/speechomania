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

export function learnCards(content) {
  if (content?.player !== 'cards') return []
  return (content.steps ?? []).map((step) => ({
    text: step.text,
    audio: step.audio ?? null,
    art: step.art ?? [],
    keys: step.keys ?? [],
    colours: step.colours ?? [],
    layout: step.layout ?? 'row',
    sizes: step.sizes ?? []
  }))
}

export const checkOf = (metadata) =>
  metadata?.check?.enabled ? { questions: metadata.check.questions ?? CHECK_QUESTIONS } : null

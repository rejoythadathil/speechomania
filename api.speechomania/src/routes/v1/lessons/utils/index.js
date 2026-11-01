export const stepCount = (content) => content?.steps?.length ?? 0

export const assignedSlugs = (children) => [
  ...new Set(children.flatMap((child) => child.assigned_lessons ?? []))
]

export function lessonView({ creator, publisher, ...lesson }) {
  return {
    ...lesson,
    step_count: stepCount(lesson.content),
    created_by_name: creator.full_name,
    published_by_name: publisher?.full_name ?? null
  }
}

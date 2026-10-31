export const stepsTotal = (content) => (content.steps?.length ?? 0) * (content.player === 'pick' ? 2 : 1)

export function starsFor(events) {
  const checks = events.filter((event) => event.step === 'check')
  return checks.length ? checks.filter((event) => event.correct && !event.wrongs).length : 1
}

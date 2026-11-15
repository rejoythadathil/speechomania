export const ASSESSMENT_STATUSES = ['draft', 'published', 'archived']

export const ASSESSABLE_PLAYERS = [
  'pick',
  'shark',
  'balloons',
  'bubbles',
  'squish',
  'compare',
  'choose',
  'place',
  'train',
  'yesno',
  'why'
]

export const CONTEXT_PLAYERS = ['shark', 'balloons']

export const CONTEXT_SIZE = 2

export const MAX_ITEMS = 50

export const MAX_TRIES = 3

export const ASSESS_STEP = 'assess'

export const RESULT_STATUSES = ['not_started', 'in_progress', 'completed']

export const ITEM_LINES = ['retry', 'skip', 'yes']

export const DEFAULT_SETTINGS = {
  scoring: { points: 1, tries: 1, retry_points: 0, pass_percent: null },
  play: { shuffle: false, hints: false, retakes: true },
  collect: { answers: true, time: true, tries: true },
  visibility: { parent_score: true, child_score: true }
}

import { Chip } from '@/components/base/badges/chip'
import { titleCase } from '@/utils/format'

const COLORS = {
  active: 'lime',
  published: 'lime',
  approved: 'lime',
  invited: 'blue',
  draft: 'yellow',
  pending: 'yellow',
  inactive: 'neutral',
  superseded: 'neutral',
  archived: 'neutral',
  disabled: 'rose',
  rejected: 'rose',
  shared: 'cyan',
  internal: 'purple',
  admin: 'purple',
  mentor: 'cyan',
  parent: 'orange',
  not_started: 'neutral',
  in_progress: 'yellow',
  completed: 'lime'
}

export function StatusChip({ value }) {
  return (
    <Chip variant="caption" color={COLORS[value] ?? 'neutral'}>
      {titleCase(value)}
    </Chip>
  )
}

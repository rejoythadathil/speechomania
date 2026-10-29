import { createIcon } from 'mochi-icons/createIcon'

export { AwardBadgeIcon as RewardIcon } from 'mochi-icons/AwardBadgeIcon'
export { BookmarkIcon as BookIcon } from 'mochi-icons/BookmarkIcon'
export { LockIcon as GrownUpIcon } from 'mochi-icons/LockIcon'
export { VolumeMuteIcon as MuteIcon } from 'mochi-icons/VolumeMuteIcon'
export { VolumeUpIcon as SayAgainIcon } from 'mochi-icons/VolumeUpIcon'

export const NextIcon = createIcon('NextIcon', <path d="M5 12h14M13 6l6 6-6 6" />)

export const BackIcon = createIcon('BackIcon', <path d="M19 12H5M11 6l-6 6 6 6" />)

export const BreakIcon = createIcon('BreakIcon', (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9v6M14 9v6" />
  </>
))

export const DoneIcon = createIcon('DoneIcon', <path d="M5 12.5l4.5 4.5L19 7.5" />)

import { cx } from '@/utils/cx'
import { characterMarkup } from './characters.js'
import styles from './child.module.css'
import { Notes, Water } from './scene.jsx'

export const ACTIONS = {
  swim: { motion: styles.swim, variant: 'act', water: true },
  walk: { motion: styles.walk },
  fly: { motion: styles.fly, variant: 'fly' },
  bark: { motion: styles.shout, variant: 'act', bubble: 'Woof!' },
  climb: { motion: styles.climb, variant: 'act', prop: 'tree' },
  ride: { motion: styles.ride, variant: 'act' },
  morning: { variant: 'awake', morning: true },
  sing: { motion: styles.shout, notes: true },
  school: { motion: styles.walk, variant: 'act', prop: 'school' },
  roar: { motion: styles.shout, variant: 'act', bubble: 'Roar!' }
}

export function Actor({ character, left, variant = 'idle', action, asleep, hint, dim, ring, onTap, label }) {
  const acting = action ? ACTIONS[action] : null
  return (
    <button
      type="button"
      className={cx(styles.actor, onTap && styles.tap, !action && !ring && styles.idle, hint && styles.hint, dim && styles.dim, acting?.motion)}
      style={{ left: `${left}%` }}
      onClick={onTap}
      disabled={!onTap}
      aria-label={label}
    >
      <span className={styles.body} dangerouslySetInnerHTML={{ __html: characterMarkup(character, asleep ? 'sleep' : acting?.variant ?? variant) }} />
      {acting?.water ? <Water /> : null}
      {acting?.bubble ? <span className={styles.bubble}>{acting.bubble}</span> : null}
      {acting?.notes ? <Notes /> : null}
      {asleep ? <span className={styles.zz} aria-hidden="true">z z</span> : null}
      {ring ? (
        <>
          <span className={styles.ring} style={{ '--ring': ring.colour }} />
          <span className={cx(styles.tag, ring.negative ? styles.tagNeg : styles.tagPos)}>{ring.label}</span>
        </>
      ) : null}
    </button>
  )
}

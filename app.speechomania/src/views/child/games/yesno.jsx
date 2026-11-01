import { useState } from 'react'
import { ART } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { Picture, useShake } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

const BUTTONS = [[true, 'thumbs-up', 'Yes'], [false, 'thumbs-down', 'No']]

export function YesNoGame(props) {
  const { step } = props
  const round = useRound(props)
  const [picked, setPicked] = useState(null)
  const { shaking, shake, stop } = useShake()
  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <Picture step={step} />
        <div className={styles.thumbs}>
          {BUTTONS.map(([value, art, label]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={cx(styles.thumb, picked === value && styles.right, shaking === value && styles.shake, round.hint && round.open && value === step.answer && styles.hint)}
              onAnimationEnd={stop}
              onClick={(event) => {
                if (!round.open) return
                if (value !== step.answer) {
                  shake(value)
                  return round.wrong()
                }
                setPicked(value)
                round.right(event.currentTarget)
              }}
            >
              <img src={ART[art]} alt="" draggable="false" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

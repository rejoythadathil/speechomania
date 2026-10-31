import { useMemo, useState } from 'react'
import { ART, StepArt } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { shuffle, useRound } from './use-round.js'
import styles from './games.module.css'

export function BalloonsGame(props) {
  const { step, steps } = props
  const round = useRound(props)
  const options = useMemo(() => shuffle([step, ...shuffle(steps.filter((other) => other.word !== step.word)).slice(0, 2)]), [step, steps])
  const [popped, setPopped] = useState(null)
  const { shaking, shake, stop } = useShake()

  return (
    <div className={styles.stage}>
      <div className={styles.balloons}>
        {options.map((option, index) => (
          <button
            key={option.word}
            type="button"
            aria-label={option.word}
            className={cx(styles.balloon, styles[`float${index}`], popped === index && styles.popped, shaking === index && styles.shake, round.hint && round.open && option === step && styles.hint)}
            onAnimationEnd={stop}
            onClick={(event) => {
              if (!round.open) return
              if (option !== step) {
                shake(index)
                return round.wrong()
              }
              setPopped(index)
              round.right(event.currentTarget)
            }}
          >
            <img className={styles.balloonBody} src={ART[popped === index ? 'pop' : 'balloon']} alt="" draggable="false" />
            <StepArt step={option} className={styles.badge} artClassName={styles.badgeArt} />
          </button>
        ))}
      </div>
    </div>
  )
}

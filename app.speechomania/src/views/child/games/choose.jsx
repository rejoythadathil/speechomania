import { useState } from 'react'
import { Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

export function ChooseGame(props) {
  const { step } = props
  const round = useRound(props)
  const [picked, setPicked] = useState(null)
  const { shaking, shake, stop } = useShake()

  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <div className={styles.versus}>
          {step.choices.map((choice, index) => (
            <button
              key={choice}
              type="button"
              aria-label={choice}
              className={cx(
                styles.versusCard,
                picked === choice && styles.right,
                shaking === choice && styles.shake,
                round.hint && round.open && choice === step.answer && styles.hint
              )}
              onAnimationEnd={stop}
              onClick={(event) => {
                if (!round.open) return
                if (choice !== step.answer) {
                  shake(choice)
                  return round.wrong(choice)
                }
                setPicked(choice)
                round.right(event.currentTarget, choice)
              }}
            >
              <Art name={step.art[index]} className={styles.versusArt} />
              <span>{choice}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

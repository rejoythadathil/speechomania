import { useState } from 'react'
import { ART, Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

export function CompareGame(props) {
  const { step } = props
  const round = useRound(props)
  const [picked, setPicked] = useState(null)
  const { shaking, shake, stop } = useShake()
  const side = step.choices.indexOf(step.answer)

  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <img
          className={cx(styles.scale, picked && (side === 0 ? styles.tipLeft : styles.tipRight))}
          src={ART.scale}
          alt=""
          draggable="false"
        />
        <div className={styles.versus}>
          {step.choices.map((choice, index) => (
            <button
              key={choice}
              type="button"
              aria-label={`The ${choice}`}
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

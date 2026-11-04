import { useMemo, useState } from 'react'
import { StepArt } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { shuffle } from './use-round.js'
import styles from './games.module.css'

export function Picture({ step, className }) {
  return (
    <StepArt
      step={step}
      className={cx(styles.picture, className)}
      artClassName={styles.pictureArt}
    />
  )
}

export function useShake() {
  const [shaking, setShaking] = useState(null)
  return { shaking, shake: setShaking, stop: () => setShaking(null) }
}

export function WordChoices({ choices, answer, round, className, label = (choice) => choice }) {
  const order = useMemo(() => shuffle(choices), [choices])
  const [picked, setPicked] = useState(null)
  const { shaking, shake, stop } = useShake()
  return (
    <div className={cx(styles.choices, className)}>
      {order.map((choice) => (
        <button
          key={choice}
          type="button"
          className={cx(
            styles.chip,
            picked === choice && styles.right,
            shaking === choice && styles.shake,
            round.hint && round.open && choice === answer && styles.hint
          )}
          disabled={!round.open && picked !== choice}
          onAnimationEnd={stop}
          onClick={(event) => {
            if (!round.open) return
            if (choice !== answer) {
              shake(choice)
              return round.wrong(choice)
            }
            setPicked(choice)
            round.right(event.currentTarget, choice)
          }}
        >
          {label(choice)}
        </button>
      ))}
    </div>
  )
}

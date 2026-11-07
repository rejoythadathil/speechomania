import { useMemo, useState } from 'react'
import { Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { shuffle, useRound } from './use-round.js'
import styles from './games.module.css'

const spotClass = (choice) => styles[`at-${choice.replace(/\s+/g, '-')}`]

export function PlaceGame(props) {
  const { step } = props
  const round = useRound(props)
  const [thing, spot] = step.art
  const order = useMemo(() => shuffle(step.choices), [step.choices])
  const [placed, setPlaced] = useState(null)
  const { shaking, shake, stop } = useShake()

  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <div className={styles.placeScene} data-spot={spot}>
          <Art name={spot} className={styles.placeSpot} />
          {order.map((choice) => (
            <button
              key={choice}
              type="button"
              className={cx(
                styles.target,
                spotClass(choice),
                placed === choice && styles.taken,
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
                setPlaced(choice)
                round.right(event.currentTarget, choice)
              }}
            >
              {choice}
            </button>
          ))}
          <Art
            name={thing}
            className={cx(styles.thing, placed && spotClass(placed), placed && styles.placed)}
          />
        </div>
      </div>
    </div>
  )
}

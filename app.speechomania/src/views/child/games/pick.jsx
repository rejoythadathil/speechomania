import { useState } from 'react'
import { ACTION_ART, ART } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

const NAMES = { swimmer: 'big boy' }

export function PickGame(props) {
  const { page, step, contrast } = props
  const round = useRound(props)
  const [picked, setPicked] = useState(null)
  const { shaking, shake, stop } = useShake()
  const other = step.choices.find((id) => id !== step.answer)
  const order = page.side === 'left' ? [step.answer, other] : [other, step.answer]
  const revealed = round.phase !== 'asking'

  return (
    <div className={styles.stage}>
      <div className={styles.pair}>
        {order.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={`The ${id}`}
            className={cx(
              styles.animal,
              picked === id && styles.right,
              shaking === id && styles.shake,
              round.hint && round.open && id === step.answer && styles.hint
            )}
            onAnimationEnd={stop}
            onClick={(event) => {
              if (!round.open) return
              if (id !== step.answer) {
                shake(id)
                return round.wrong(id)
              }
              setPicked(id)
              round.right(event.currentTarget, id)
            }}
          >
            <img src={ART[id]} alt="" draggable="false" />
            <span className={styles.animalName}>{NAMES[id] ?? id}</span>
            {revealed && id === step.actor ? (
              <img
                className={styles.prop}
                src={ART[ACTION_ART[step.act]]}
                alt=""
                draggable="false"
              />
            ) : null}
            {revealed && id === step.answer ? (
              <span className={styles.tag}>{contrast ?? 'Yes'}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

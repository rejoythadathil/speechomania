import { useMemo, useState } from 'react'
import { ART } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { Picture, useShake } from './parts.jsx'
import { shuffle, useRound } from './use-round.js'
import styles from './games.module.css'

export function TrainGame(props) {
  const { step } = props
  const round = useRound(props)
  const wagons = useMemo(() => shuffle(step.choices), [step.choices])
  const [loaded, setLoaded] = useState(null)
  const { shaking, shake, stop } = useShake()
  const [before, after] = step.text.split('…')
  const word = loaded && !before.trim() ? `${loaded[0].toUpperCase()}${loaded.slice(1)}` : loaded

  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <Picture step={step} className={styles.small} />
        <p className={styles.sentence}>
          {before}
          <span className={cx(styles.gap, loaded && styles.filled)}>{word ?? ' '}</span>
          {after}
        </p>
        <div className={cx(styles.train, loaded && styles.leaving)}>
          <img className={styles.engine} src={ART.engine} alt="" draggable="false" />
          {wagons.map((choice) => (
            <button
              key={choice}
              type="button"
              className={cx(
                styles.wagon,
                shaking === choice && styles.shake,
                loaded === choice && styles.empty,
                round.hint && round.open && choice === step.answer && styles.hint
              )}
              onAnimationEnd={stop}
              onClick={(event) => {
                if (!round.open) return
                if (choice !== step.answer) {
                  shake(choice)
                  return round.wrong(choice)
                }
                setLoaded(choice)
                round.right(event.currentTarget, choice)
              }}
            >
              <img src={ART.wagon} alt="" draggable="false" />
              <span>{choice}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

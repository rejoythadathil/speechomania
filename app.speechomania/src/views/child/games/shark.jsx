import { useMemo, useRef, useState } from 'react'
import { ART, FISH, StepArt } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { useShake } from './parts.jsx'
import { shuffle, useRound } from './use-round.js'
import styles from './games.module.css'

export function SharkGame(props) {
  const { step, steps } = props
  const round = useRound(props)
  const options = useMemo(
    () =>
      shuffle([step, ...shuffle(steps.filter((other) => other.word !== step.word)).slice(0, 2)]),
    [step, steps]
  )
  const stage = useRef(null)
  const shark = useRef(null)
  const [eaten, setEaten] = useState(null)
  const [chomp, setChomp] = useState(false)
  const { shaking, shake, stop } = useShake()

  function feed(option, index, event) {
    if (!round.open || eaten) return
    if (option !== step) {
      shake(index)
      return round.wrong(option.word)
    }
    const area = stage.current.getBoundingClientRect()
    const mouth = shark.current.getBoundingClientRect()
    const fish = event.currentTarget.getBoundingClientRect()
    setEaten({
      index,
      left: mouth.left - area.left + mouth.width * 0.72 - fish.width / 2,
      top: mouth.top - area.top + mouth.height * 0.45 - fish.height / 2
    })
    setTimeout(() => {
      setChomp(true)
      round.right(shark.current, option.word)
    }, 700)
  }

  return (
    <div ref={stage} className={styles.stage}>
      <img
        ref={shark}
        className={cx(styles.shark, chomp && styles.chomp)}
        src={ART.shark}
        alt="Shark"
        draggable="false"
      />
      {options.map((option, index) => (
        <button
          key={option.word}
          type="button"
          aria-label={option.word}
          className={cx(
            styles.fish,
            styles[`swim${index}`],
            eaten?.index === index && styles.eaten,
            shaking === index && styles.shake,
            round.hint && round.open && option === step && styles.hint
          )}
          style={eaten?.index === index ? { left: eaten.left, top: eaten.top } : undefined}
          onAnimationEnd={stop}
          onClick={(event) => feed(option, index, event)}
        >
          <span className={styles.bob}>
            <img
              className={cx(styles.fishBody, FISH[index] !== 'blowfish' && styles.flip)}
              src={ART[FISH[index]]}
              alt=""
              draggable="false"
            />
            <StepArt step={option} className={styles.badge} artClassName={styles.badgeArt} />
          </span>
        </button>
      ))}
    </div>
  )
}

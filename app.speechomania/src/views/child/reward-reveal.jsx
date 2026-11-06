import { useEffect, useRef, useState } from 'react'
import { ART } from '@/components/child/art.jsx'
import { GameThumb } from '@/components/child/game-thumb.jsx'
import { cx } from '@/utils/cx'
import styles from './lesson-player.module.css'

const COUNT_MS = 80
const EXTRAS_MS = 1100
const GIFT_MS = 1300
const OPEN_MS = 1200

export function RewardReveal({ result, player, celebrate }) {
  const still = celebrate.motion === 'off'
  const total = result.got ?? 0
  const [shown, setShown] = useState(still ? total : 0)
  const [stage, setStage] = useState(still ? 4 : 0)
  const prize = useRef(null)
  const gift = useRef(null)

  useEffect(() => {
    const timers = []
    const later = (run, ms) => timers.push(setTimeout(run, ms))
    if (still) {
      celebrate.finale(prize.current, result.prize.big)
      return undefined
    }
    let count = 0
    const tick = () => {
      if (count < total) {
        count += 1
        setShown(count)
        return later(tick, COUNT_MS)
      }
      setStage(1)
      later(() => celebrate.finale(prize.current, result.prize.big), 60)
      later(() => setStage(2), EXTRAS_MS)
      if (!result.reward?.new_friend) return
      later(() => setStage(3), EXTRAS_MS + GIFT_MS)
      later(
        () => {
          setStage(4)
          celebrate.cheer(gift.current)
        },
        EXTRAS_MS + GIFT_MS + OPEN_MS
      )
    }
    later(tick, 300)
    return () => timers.forEach(clearTimeout)
  }, [celebrate, result, still, total])

  const reward = result.reward ?? {}
  return (
    <>
      <img
        ref={prize}
        className={cx(
          styles.trophy,
          !result.prize.big && styles.smallPrize,
          stage < 1 && styles.waiting
        )}
        src={ART[result.prize.art]}
        alt={result.prize.art}
        draggable="false"
      />
      <h1 className={cx(stage < 1 && styles.waiting)}>{result.prize.title}</h1>
      {result.total ? (
        <p
          className={cx(styles.score, stage === 0 && styles.counting)}
          aria-label={`${result.got} of ${result.total}`}
        >
          <img src={ART.star} alt="" draggable="false" />
          {shown} of {result.total}
        </p>
      ) : null}
      {stage >= 2 && (reward.new_best || reward.new_badge) ? (
        <span className={styles.extras}>
          {reward.new_best ? (
            <span className={styles.newBest}>
              <img src={ART['glowing-star']} alt="" draggable="false" />
              New best!
            </span>
          ) : null}
          {reward.new_badge ? (
            <span className={styles.newBadge}>
              <span className={styles.newBadgeArt}>
                <GameThumb player={player} />
                <img src={ART.medal} alt="" draggable="false" />
              </span>
              New badge!
            </span>
          ) : null}
        </span>
      ) : null}
      {stage >= 3 && reward.new_friend ? (
        <span className={styles.newFriend} ref={gift}>
          {stage === 3 ? (
            <img className={styles.gift} src={ART.gift} alt="" draggable="false" />
          ) : (
            <>
              <img
                className={styles.friendArt}
                src={ART[reward.new_friend]}
                alt={reward.new_friend}
                draggable="false"
              />
              New friend!
            </>
          )}
        </span>
      ) : null}
    </>
  )
}

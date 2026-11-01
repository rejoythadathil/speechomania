import { useMemo, useRef, useState } from 'react'
import { ART, Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { shuffle, useRound } from './use-round.js'
import styles from './games.module.css'

export function MatchGame(props) {
  const { page, steps, lines, voice, celebrate } = props
  const board = useMemo(() => ({ ...(lines.quiz ?? { text: 'Find the pairs.' }), praise: lines.yes }), [lines])
  const round = useRound({ ...props, step: board })
  const cards = useMemo(() => shuffle(page.group.flatMap((index) => [
    { pair: index, word: steps[index].first, art: steps[index].art[0] },
    { pair: index, word: steps[index].second, art: steps[index].art[1] }
  ])).map((card, id) => ({ ...card, id })), [page.group, steps])
  const [open, setOpen] = useState([])
  const [found, setFound] = useState([])
  const busy = useRef(false)

  function flip(card, event) {
    if (!round.open || busy.current || open.includes(card.id) || found.includes(card.pair)) return
    const next = [...open, card.id]
    setOpen(next)
    if (next.length < 2) return
    const [first, second] = next.map((id) => cards.find((item) => item.id === id))
    if (first.pair !== second.pair) {
      busy.current = true
      celebrate.nudge()
      setTimeout(() => {
        setOpen([])
        busy.current = false
      }, 1100)
      return
    }
    const matched = [...found, first.pair]
    setFound(matched)
    setOpen([])
    if (matched.length === page.group.length) return round.right(event.currentTarget)
    celebrate.cheer(event.currentTarget)
    voice.speak(steps[first.pair].praise ?? { text: steps[first.pair].text })
  }

  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <div className={styles.cards}>
          {cards.map((card) => {
            const faceUp = open.includes(card.id) || found.includes(card.pair)
            return (
              <button
                key={card.id}
                type="button"
                aria-label={faceUp ? card.word : 'Hidden card'}
                className={cx(styles.card, faceUp && styles.faceUp, found.includes(card.pair) && styles.found)}
                onClick={(event) => flip(card, event)}
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardBack}><img src={ART.sparkles} alt="" draggable="false" /></span>
                  <span className={styles.cardFront}>
                    <Art name={card.art} className={styles.cardArt} />
                    <b>{card.word}</b>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

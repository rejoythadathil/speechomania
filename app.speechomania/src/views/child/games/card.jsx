import { useEffect, useState } from 'react'
import { ART, StepArt } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import styles from './games.module.css'

const COLOURS = { these: 'orange', she: 'pink', they: 'green', 'can’t': 'red', an: 'orange' }

const bare = (word) => word.toLowerCase().replace(/[^a-z’']/g, '')

function colourOf(keys, text) {
  const words = text.split(/\s+/).map(bare)
  const found = keys.map((key) => key.toLowerCase()).find((key) => words.includes(key))
  return found ? (COLOURS[found] ?? 'blue') : 'blue'
}

export function CardGame({ step, voice, onDone }) {
  const [open, setOpen] = useState(false)
  const { speak } = voice
  const keys = (step.keys ?? []).map((key) => key.toLowerCase())
  const colour = colourOf(step.keys ?? [], step.text)

  useEffect(() => {
    let active = true
    const shownAt = performance.now()
    const timer = setTimeout(async () => {
      if (!active) return
      setOpen(true)
      await speak(step)
      if (active)
        onDone({ correct: true, wrongs: 0, latency_ms: Math.round(performance.now() - shownAt) })
    }, 600)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [onDone, speak, step])

  const words = step.text.split(/\s+/)
  return (
    <div className={styles.stage}>
      <button
        type="button"
        className={cx(styles.learnCard, open && styles.learnOpen)}
        onClick={() => (open ? voice.replay() : setOpen(true))}
        aria-label={step.text}
      >
        <span className={styles.learnInner}>
          <span className={cx(styles.learnFace, styles.learnBack)} aria-hidden="true">
            <img src={ART.cards} alt="" draggable="false" />
          </span>
          <span
            className={cx(styles.learnFace, styles.learnFront)}
            data-colour={colour}
            aria-hidden="true"
          >
            <StepArt step={step} className={styles.learnArt} artClassName={styles.learnArtImg} />
            <span className={styles.learnText}>
              {words.map((word, index) => (
                <span
                  key={index}
                  className={cx(
                    keys.includes(bare(word)) && styles.learnKey,
                    voice.text === step.text && voice.wordIndex === index && styles.learnSpoken
                  )}
                >
                  {word}{' '}
                </span>
              ))}
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}

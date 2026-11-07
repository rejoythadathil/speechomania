import { useEffect, useState } from 'react'
import { ART, Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import styles from './games.module.css'

const bare = (word) => word.toLowerCase().replace(/[^a-z’']/g, '')

const spotClass = (layout) => styles[`at-${layout.replace(/\s+/g, '-')}`]

function CardArt({ step }) {
  const art = step.art ?? []
  const layout = step.layout ?? 'row'
  if (layout !== 'row') {
    const [thing, spot] = art
    return (
      <span className={styles.learnArt}>
        <span className={styles.learnPlace} data-spot={spot}>
          <Art name={spot} className={styles.placeSpot} />
          <Art
            name={thing}
            className={cx(styles.thing, styles.placed, spotClass(layout))}
            alt={thing}
          />
        </span>
      </span>
    )
  }
  return (
    <span className={styles.learnArt} data-count={art.length}>
      {art.map((name, index) => (
        <Art
          key={`${name}-${index}`}
          name={name}
          className={styles.learnArtImg}
          style={step.sizes?.[index] ? { scale: step.sizes[index] } : undefined}
        />
      ))}
    </span>
  )
}

export function CardGame({ step, voice, onDone }) {
  const [open, setOpen] = useState(false)
  const { speak } = voice
  const keys = (step.keys ?? []).map((key) => key.toLowerCase())
  const colourOf = (word) => step.colours?.[keys.indexOf(bare(word))] ?? 'blue'
  const words = step.text.split(/\s+/)
  const first = words.find((word) => keys.includes(bare(word)))

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
            data-colour={first ? colourOf(first) : 'blue'}
            aria-hidden="true"
          >
            <CardArt step={step} />
            <span className={styles.learnText}>
              {words.map((word, index) => {
                const [, core, tail] = word.match(/^(.*?)([.,!?]*)$/)
                const key = keys.includes(bare(word))
                return (
                  <span key={index}>
                    <span
                      className={cx(
                        voice.text === step.text && voice.wordIndex === index && styles.learnSpoken
                      )}
                    >
                      <span
                        className={cx(key && styles.learnKey)}
                        data-colour={key ? colourOf(word) : undefined}
                      >
                        {core}
                      </span>
                      {tail}
                    </span>{' '}
                  </span>
                )
              })}
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}

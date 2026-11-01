import { useEffect } from 'react'
import { ART } from '@/components/child/art.jsx'
import { Picture } from './parts.jsx'
import styles from './games.module.css'

export function StoryGame({ page, step, voice, onDone }) {
  const { speak } = voice
  useEffect(() => {
    let active = true
    const shownAt = performance.now()
    ;(async () => {
      if (page.intro) await speak(page.intro)
      if (!active) return
      await speak(step)
      if (active)
        onDone({ correct: true, wrongs: 0, latency_ms: Math.round(performance.now() - shownAt) })
    })()
    return () => {
      active = false
    }
  }, [onDone, page, speak, step])
  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        {step.art?.length || step.image_url ? (
          <Picture step={step} />
        ) : (
          <img className={styles.storyArt} src={ART.book} alt="" draggable="false" />
        )}
      </div>
    </div>
  )
}

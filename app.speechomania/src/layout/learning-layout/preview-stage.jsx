import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { BreakSheet } from '@/components/child/sheets.jsx'
import { useCelebrate } from '@/components/child/use-celebrate.js'
import { useVoice } from '@/components/child/use-voice.js'
import styles from './learning-layout.module.css'

export function PreviewStage({ onClose, children }) {
  const [muted, setMuted] = useState(false)
  const [resting, setResting] = useState(false)
  const voice = useVoice({ sound: 'normal', muted })
  const celebrate = useCelebrate({ motion: 'gentle', sound: 'normal', muted })
  const { stop } = voice

  useEffect(() => {
    const page = document.getElementById('root')
    page.inert = true
    return () => {
      page.inert = false
    }
  }, [])

  const bar = useMemo(
    () => ({
      muted,
      onMute: () => setMuted((current) => !current),
      onBreak: () => {
        stop()
        setResting(true)
      },
      onGrownUp: () => {
        stop()
        onClose()
      }
    }),
    [muted, onClose, stop]
  )

  return createPortal(
    <div
      className={styles.root}
      style={{ zIndex: 60 }}
      data-motion="gentle"
      data-colour="normal"
      role="dialog"
      aria-modal="true"
      aria-label="Preview"
    >
      {children({ voice, celebrate, bar })}
      {resting ? <BreakSheet onClose={() => setResting(false)} /> : null}
    </div>,
    document.body
  )
}

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { BreakSheet, GrownUpSheet, NudgeSheet, RestSheet } from '@/components/child/sheets.jsx'
import { useCelebrate } from '@/components/child/use-celebrate.js'
import { useScreenTime } from '@/components/child/use-screen-time.js'
import { useVoice } from '@/components/child/use-voice.js'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import styles from './learning-layout.module.css'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribe = (notify) => {
  const query = window.matchMedia(REDUCED)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const prefersReduced = () => window.matchMedia(REDUCED).matches

export function LearningLayout() {
  const { childId } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const guest = auth.user.role === 'guest'
  const learner = useResource(`/learning/children/${childId}`)
  const reduced = useSyncExternalStore(subscribe, prefersReduced)
  const [muted, setMuted] = useState(false)
  const [sheet, setSheet] = useState(null)
  const sensory = learner.data?.sensory_settings ?? {}
  const motion = reduced ? 'off' : sensory.motion === 'normal' ? 'full' : 'gentle'
  const voice = useVoice({ sound: sensory.sound, muted })
  const celebrate = useCelebrate({ motion, sound: sensory.sound, muted })
  const { stop } = voice
  const time = useScreenTime(childId)
  const interrupted = time.resting || time.nudge

  useEffect(() => {
    if (interrupted) stop()
  }, [interrupted, stop])

  const closeSheet = useCallback(() => setSheet(null), [])
  const leave = useCallback(
    async (pin) => {
      await api(`/learning/children/${childId}/exit`, { method: 'POST', body: { pin } })
      stop()
      if (guest) {
        await auth.signOut()
        window.location.assign('/')
        return
      }
      navigate(`/children/${childId}`)
    },
    [auth, childId, guest, navigate, stop]
  )

  const bar = useMemo(
    () => ({
      muted,
      onMute: () => setMuted((current) => !current),
      onBreak: () => {
        stop()
        setSheet('break')
      },
      onGrownUp: () => setSheet('grown-up')
    }),
    [muted, stop]
  )

  return (
    <div className={styles.root} data-motion={motion} data-colour={sensory.colour ?? 'normal'}>
      {learner.data ? (
        <Outlet
          context={{
            learner: learner.data,
            reloadLearner: learner.reload,
            voice,
            bar,
            motion,
            celebrate
          }}
        />
      ) : (
        <div className={styles.state} role={learner.error ? 'alert' : 'status'}>
          {learner.error ? (
            <>
              <p>
                {learner.error.status === 404
                  ? 'This learner isn’t available.'
                  : learner.error.message}
              </p>
              <button type="button" className={styles.back} onClick={() => navigate('/children')}>
                Back to my children
              </button>
            </>
          ) : (
            <p>Getting ready…</p>
          )}
        </div>
      )}
      {sheet === 'break' ? <BreakSheet onClose={closeSheet} /> : null}
      {time.resting && sheet !== 'grown-up' ? (
        <RestSheet left={time.restLeft} onGrownUp={() => setSheet('grown-up')} />
      ) : null}
      {time.nudge && !sheet ? (
        <NudgeSheet
          onKeepPlaying={time.keepPlaying}
          onStop={() => {
            time.keepPlaying()
            setSheet('grown-up')
          }}
        />
      ) : null}
      {sheet === 'grown-up' ? (
        <GrownUpSheet hasPin={learner.data?.has_pin} onUnlock={leave} onClose={closeSheet} />
      ) : null}
    </div>
  )
}

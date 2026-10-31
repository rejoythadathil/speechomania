import { useCallback, useEffect, useRef, useState } from 'react'

export function shuffle(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

export function useRound({ page, step, lines, voice, celebrate, onDone }) {
  const [phase, setPhase] = useState('asking')
  const [wrongs, setWrongs] = useState(0)
  const count = useRef(0)
  const closed = useRef(false)
  const shownAt = useRef(0)
  const { speak } = voice

  useEffect(() => {
    let active = true
    shownAt.current = performance.now()
    ;(async () => {
      if (page.intro) await speak(page.intro)
      if (active && !closed.current) speak(step)
    })()
    return () => {
      active = false
    }
  }, [page, speak, step])

  const finish = useCallback(async (correct, line) => {
    closed.current = true
    setPhase(correct ? 'right' : 'missed')
    const result = { correct, wrongs: count.current, latency_ms: Math.round(performance.now() - shownAt.current) }
    if (line) await speak(line)
    setTimeout(() => onDone(result), 500)
  }, [onDone, speak])

  const right = useCallback((element) => {
    if (closed.current) return
    celebrate.cheer(element)
    finish(true, step.praise ?? step.sentence ?? lines.yes)
  }, [celebrate, finish, lines.yes, step])

  const wrong = useCallback(() => {
    if (closed.current) return
    count.current += 1
    setWrongs(count.current)
    celebrate.nudge()
    if (page.step === 'check') return finish(false, lines.skip)
    if (page.step === 'learn' && count.current > 1) return finish(false, step.teach)
    speak(lines.retry).then(() => !closed.current && speak(step))
  }, [celebrate, finish, lines.retry, lines.skip, page.step, speak, step])

  return { phase, wrongs, hint: wrongs >= 2 || (page.step === 'learn' && wrongs >= 1), open: phase === 'asking', right, wrong }
}

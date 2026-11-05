import { useCallback, useEffect, useRef, useState } from 'react'

export const STREAK = 3

const ANSWERED = ['play', 'check', 'quiz', 'assess', 'learn']

export function tallyOf(answers) {
  const answered = answers.filter((event) => ANSWERED.includes(event.step))
  const wins = answered.filter((event) => event.correct).length
  let streak = 0
  for (let index = answered.length - 1; index >= 0; index -= 1) {
    if (!answered[index].correct || answered[index].wrongs) break
    streak += 1
  }
  return { wins, streak }
}

export function shuffle(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

export function useRound({ page, step, lines, voice, celebrate, tally, onDone }) {
  const [phase, setPhase] = useState('asking')
  const [wrongs, setWrongs] = useState(0)
  const count = useRef(0)
  const chosen = useRef(undefined)
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

  const finish = useCallback(
    async (correct, line) => {
      closed.current = true
      setPhase(correct ? 'right' : 'missed')
      const result = {
        correct,
        wrongs: count.current,
        latency_ms: Math.round(performance.now() - shownAt.current),
        ...(chosen.current === undefined ? {} : { choice: String(chosen.current).slice(0, 60) })
      }
      if (line) await speak(line)
      setTimeout(() => onDone(result), 500)
    },
    [onDone, speak]
  )

  const right = useCallback(
    (element, choice) => {
      if (closed.current) return
      chosen.current = choice
      const streak = count.current ? 0 : (tally?.streak ?? 0) + 1
      if (streak && streak % STREAK === 0) celebrate.streak(element)
      else celebrate.cheer(element)
      finish(true, step.praise ?? step.sentence ?? lines.yes)
    },
    [celebrate, finish, lines.yes, step, tally?.streak]
  )

  const wrong = useCallback(
    (choice) => {
      if (closed.current) return
      chosen.current = choice
      count.current += 1
      setWrongs(count.current)
      celebrate.nudge()
      if (page.step === 'check' || page.step === 'quiz') return finish(false, lines.skip)
      if (page.step === 'assess' && count.current >= page.tries) return finish(false, lines.skip)
      if (page.step === 'learn' && count.current > 1) return finish(false, step.teach)
      speak(lines.retry).then(() => !closed.current && speak(step))
    },
    [celebrate, finish, lines.retry, lines.skip, page.step, page.tries, speak, step]
  )

  const hint =
    page.step === 'assess'
      ? Boolean(page.hints) && wrongs >= 1
      : page.step === 'quiz'
        ? false
        : wrongs >= 2 || (page.step === 'learn' && wrongs >= 1)
  return { phase, wrongs, hint, open: phase === 'asking', right, wrong }
}

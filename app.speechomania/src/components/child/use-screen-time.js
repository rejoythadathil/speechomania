import { useCallback, useEffect, useState } from 'react'

const MINUTE = 60000
export const NUDGE_EVERY = 15 * MINUTE
export const PLAY_LIMIT = 60 * MINUTE
export const REST = 15 * MINUTE
const TICK = 1000
const MAX_STEP = 5 * TICK

const fresh = (now) => ({ used: 0, nudged: 0, rest_until: 0, last: now })

export function nextTime(state, now) {
  if (!state) return fresh(now)
  if (state.rest_until) return now >= state.rest_until ? fresh(now) : { ...state, last: now }
  const gap = now - state.last
  if (gap >= REST) return fresh(now)
  const used = state.used + Math.max(0, Math.min(gap, MAX_STEP))
  return { ...state, used, last: now, rest_until: used >= PLAY_LIMIT ? now + REST : 0 }
}

export const nudgeDue = (state) =>
  !state.rest_until && Math.floor(state.used / NUDGE_EVERY) > state.nudged

const keyOf = (childId) => `speechomania:screen-time:${childId}`

function load(childId) {
  try {
    return JSON.parse(localStorage.getItem(keyOf(childId)))
  } catch {
    return null
  }
}

function save(childId, state) {
  try {
    localStorage.setItem(keyOf(childId), JSON.stringify(state))
  } catch {
    return
  }
}

export function useScreenTime(childId) {
  const [state, setState] = useState(() => nextTime(load(childId), Date.now()))

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return
      setState((current) => {
        const next = nextTime(load(childId) ?? current, Date.now())
        save(childId, next)
        return next
      })
    }
    tick()
    const timer = setInterval(tick, TICK)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [childId])

  const keepPlaying = useCallback(() => {
    setState((current) => {
      const next = { ...current, nudged: Math.floor(current.used / NUDGE_EVERY) }
      save(childId, next)
      return next
    })
  }, [childId])

  return {
    resting: Boolean(state.rest_until),
    restLeft: Math.max(0, state.rest_until - state.last),
    nudge: nudgeDue(state),
    keepPlaying
  }
}

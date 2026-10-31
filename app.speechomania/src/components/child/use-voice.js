import { useCallback, useEffect, useRef, useState } from 'react'

const VOLUME = { normal: 1, quiet: 0.5 }

export function estimateWords(text) {
  let time = 0.1
  const words = text.trim().split(/\s+/).map((word) => {
    const start = time
    const end = start + 0.14 + word.replace(/[^\p{L}\p{N}]/gu, '').length * 0.068
    time = end + (/[.!?]$/.test(word) ? 0.38 : 0.06)
    return { word, start, end }
  })
  return { words, duration: time }
}

export function useVoice({ sound = 'normal', muted = false }) {
  const [line, setLine] = useState({ text: '', index: -1 })
  const playing = useRef(null)
  const last = useRef(null)
  const settings = useRef({ sound, silent: muted || sound === 'off' })

  useEffect(() => {
    settings.current = { sound, silent: muted || sound === 'off' }
    const current = playing.current
    if (!settings.current.silent || !current) return
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    if (current.audio) {
      const time = current.audio.currentTime
      current.audio.onended = null
      current.audio.pause()
      current.audio = null
      current.started = performance.now() - time * 1000
    }
  }, [muted, sound])

  const stop = useCallback(() => {
    const current = playing.current
    playing.current = null
    if (!current) return
    cancelAnimationFrame(current.frame)
    current.audio?.pause()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    current.finish()
  }, [])

  const speak = useCallback((source) => {
    stop()
    last.current = source
    const { silent, sound: level } = settings.current
    const text = typeof source === 'string' ? source : source.text
    const audio = typeof source === 'string' ? null : source.audio
    const timing = audio?.words?.length ? audio : estimateWords(text)
    let finish
    const done = new Promise((resolve) => (finish = resolve))
    const current = { frame: 0, audio: null, started: performance.now(), finish }
    playing.current = current
    setLine({ text, index: -1 })

    const clock = () => (current.audio ? current.audio.currentTime : (performance.now() - current.started) / 1000)
    const end = () => {
      if (playing.current !== current) return
      playing.current = null
      cancelAnimationFrame(current.frame)
      setLine((value) => ({ ...value, index: -1 }))
      finish()
    }
    const tick = () => {
      const time = clock()
      let index = -1
      timing.words.forEach((word, position) => {
        if (time >= word.start) index = position
      })
      if (index >= 0 && time > timing.words[index].end + 0.3) index = -1
      setLine((value) => (value.index === index ? value : { ...value, index }))
      if (!current.audio && time >= timing.duration) return end()
      current.frame = requestAnimationFrame(tick)
    }
    const runSilently = () => {
      current.audio = null
      current.started = performance.now()
    }

    if (!silent && audio?.url) {
      current.audio = new Audio(audio.url)
      current.audio.volume = VOLUME[level] ?? 1
      current.audio.onended = end
      current.audio.onerror = runSilently
      current.audio.play().catch(runSilently)
    } else if (!silent && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.volume = VOLUME[level] ?? 1
      window.speechSynthesis.speak(utterance)
    }
    current.frame = requestAnimationFrame(tick)
    return done
  }, [stop])

  useEffect(() => stop, [stop])

  const replay = useCallback(() => (last.current ? speak(last.current) : Promise.resolve()), [speak])

  return { speak, stop, replay, text: line.text, wordIndex: line.index }
}

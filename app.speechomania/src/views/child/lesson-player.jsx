import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { ART, GAME_ART } from '@/components/child/art.jsx'
import { NextIcon } from '@/components/child/child-icons.jsx'
import { BottomBar, TopBar } from '@/components/child/chrome.jsx'
import { ReadAlong } from '@/components/child/read-along.jsx'
import { sceneFor } from '@/components/child/scenes.js'
import { Scenery } from '@/components/child/scenery.jsx'
import child from '@/components/child/child.module.css'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { cx } from '@/utils/cx'
import { GAMES, shuffle } from './games/index.js'
import styles from './lesson-player.module.css'

const PAIRS_PER_BOARD = 3

const LINES = {
  intro: null,
  quiz: { text: 'Now, show me.' },
  retry: { text: 'Let’s look again.' },
  skip: { text: 'Let’s try another.' },
  yes: { text: 'Yes!' },
  outro: { text: 'You did it!' },
  reward: { text: 'You earned a trophy!' }
}

function balancedSides(count) {
  for (;;) {
    const sides = shuffle(Array.from({ length: count }, (_, index) => (index % 2 ? 'left' : 'right')))
    if (!sides.some((side, index) => index >= 2 && sides[index - 1] === side && sides[index - 2] === side)) return sides
  }
}

function planPages(content, lines) {
  const indexes = content.steps.map((_, index) => index)
  let pages
  if (content.player === 'story') {
    pages = indexes.map((index) => ({ step: 'story', index }))
  } else if (content.player === 'pick') {
    const round = (step) => {
      const order = shuffle(indexes)
      const sides = balancedSides(order.length)
      return order.map((index, position) => ({ step, index, side: sides[position] }))
    }
    pages = [...round('learn'), ...round('check')]
    const firstCheck = pages.findIndex((page) => page.step === 'check')
    pages[firstCheck] = { ...pages[firstCheck], intro: lines.quiz }
  } else if (content.player === 'match') {
    const order = shuffle(indexes)
    const boards = Math.floor(order.length / PAIRS_PER_BOARD)
    pages = Array.from({ length: Math.min(content.rounds ?? boards, boards) }, (_, board) => {
      const group = order.slice(board * PAIRS_PER_BOARD, (board + 1) * PAIRS_PER_BOARD)
      return { step: 'play', index: group[0], group }
    })
  } else {
    pages = shuffle(indexes).slice(0, Math.min(content.rounds ?? indexes.length, indexes.length)).map((index) => ({ step: 'play', index }))
  }
  if (pages.length && lines.intro) pages[0] = { ...pages[0], intro: lines.intro }
  return pages
}

function Progress({ pages, at }) {
  return (
    <ol className={styles.progress} aria-label={`Round ${at + 1} of ${pages.length}`}>
      {pages.map((page, index) => (
        <li key={index} className={cx(index < at && styles.done, index === at && styles.now, page.step === 'check' && styles.check)}>
          <img src={ART.star} alt="" draggable="false" />
        </li>
      ))}
    </ol>
  )
}

function Player({ lesson, learner, voice, bar, celebrate, reloadLearner }) {
  const navigate = useNavigate()
  const content = lesson.content
  const Game = GAMES[content.player] ?? GAMES.story
  const lines = useMemo(() => ({ ...LINES, ...content.lines }), [content.lines])
  const [pages, setPages] = useState(null)
  const [at, setAt] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const attempt = useRef(null)
  const queue = useRef(Promise.resolve())
  const answers = useRef([])
  const trophy = useRef(null)
  const { speak, stop } = voice

  const send = useCallback((body) => {
    const id = attempt.current
    queue.current = queue.current.then(() => api(`/learning/attempts/${id}`, { method: 'PATCH', body })).catch(() => null)
    return queue.current
  }, [])

  async function open() {
    setError(null)
    celebrate.reset()
    try {
      attempt.current = (await api(`/learning/children/${learner.id}/attempts`, { method: 'POST', body: { lesson_id: lesson.id } })).id
    } catch (caught) {
      setError(caught.message)
      return
    }
    answers.current = []
    setResult(null)
    setWaiting(false)
    setAt(0)
    setPages(planPages(content, lines))
  }

  const finish = useCallback(async (total) => {
    const saved = await send({ events: [], steps_completed: total, completed: true })
    const scored = answers.current.filter((event) => event.step !== 'learn' && event.step !== 'story')
    const stars = saved?.stars ?? scored.filter((event) => event.correct && !event.wrongs).length
    setResult({ stars, total: scored.length })
    setPages(null)
    reloadLearner()
    requestAnimationFrame(() => celebrate.finale(trophy.current))
    await speak(lines.outro)
    speak(lines.reward)
  }, [celebrate, lines.outro, lines.reward, reloadLearner, send, speak])

  const done = useCallback((outcome) => {
    const page = pages[at]
    const event = { step: page.step, index: page.index, ...outcome }
    answers.current = [...answers.current, event]
    send({ events: [event], steps_completed: answers.current.length })
    if (page.step === 'story') return setWaiting(true)
    if (at + 1 < pages.length) return setAt(at + 1)
    finish(pages.length)
  }, [at, finish, pages, send])

  function next() {
    stop()
    setWaiting(false)
    if (at + 1 < pages.length) return setAt(at + 1)
    finish(pages.length)
  }

  const page = pages?.[at]
  const step = page ? content.steps[page.index] : null
  const art = GAME_ART[content.player] ?? GAME_ART.story
  const scene = sceneFor(content.player)

  return (
    <div className={styles.root} style={{ background: scene.background }}>
      <Scenery player={content.player} />
      {page ? (
        <Game key={at} page={page} step={step} steps={content.steps} contrast={content.contrast} lines={lines} voice={voice} celebrate={celebrate} onDone={done} />
      ) : null}
      <TopBar {...bar} centre={page ? <Progress pages={pages} at={at} /> : null} />

      {page ? (
        <section className={cx(child.card, child.caption)} aria-live="polite">
          <span className={child.kicker}>{page.step === 'learn' ? 'Learn' : page.step === 'check' ? 'Show me' : lesson.title}</span>
          <ReadAlong text={voice.text || (page.group ? lines.quiz?.text ?? '' : step.text)} wordIndex={voice.wordIndex} contrast={content.contrast} />
        </section>
      ) : null}

      {!page && !result ? (
        <section className={styles.cover}>
          <div className={styles.hero} aria-hidden="true">
            {art.map((name) => <img key={name} src={ART[name]} alt="" draggable="false" />)}
          </div>
          <div className={cx(child.card, styles.intro)}>
            <h1>{lesson.title}</h1>
            {lines.intro?.text ? <p>{lines.intro.text}</p> : null}
            <ol className={styles.how} aria-label="How to play">
              {scene.how.map(([name, label]) => (
                <li key={label}>
                  <img src={ART[name]} alt="" draggable="false" />
                  {label}
                </li>
              ))}
            </ol>
            {error ? <p className={child.error} role="alert">{error}</p> : null}
            <button type="button" className={child.go} onClick={open} autoFocus>
              Play
              <NextIcon size={28} />
            </button>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className={cx(child.card, styles.panel)}>
          <img ref={trophy} className={styles.trophy} src={ART.trophy} alt="" draggable="false" />
          <h1>You did it!</h1>
          {result.total ? (
            <p className={styles.score}>
              <img src={ART.star} alt="" draggable="false" />
              {result.stars} of {result.total}
            </p>
          ) : null}
          <span className={styles.actions}>
            <button type="button" className={child.pill} onClick={() => navigate(`/learn/${learner.id}`)}>My games</button>
            <button type="button" className={child.go} onClick={open} autoFocus>
              Play again
              <NextIcon size={28} />
            </button>
          </span>
        </section>
      ) : null}

      <BottomBar
        onSayAgain={page ? voice.replay : null}
        next={page?.step === 'story' ? (
          <button type="button" className={cx(child.go, !waiting && child.hidden)} onClick={next} disabled={!waiting} aria-hidden={!waiting}>
            Next
            <NextIcon size={28} />
          </button>
        ) : null}
      />
    </div>
  )
}

export function LessonPlayerView() {
  const { learner, voice, bar, celebrate, reloadLearner } = useOutletContext()
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = useResource(`/learning/children/${learner.id}/lessons/${lessonId}`)

  if (!lesson.data) {
    return (
      <div className={styles.root}>
        <TopBar {...bar} />
        <section className={cx(child.card, styles.panel)} role={lesson.error ? 'alert' : 'status'}>
          <h1>{lesson.error ? 'This game isn’t on your map.' : 'Getting your game ready…'}</h1>
          {lesson.error ? (
            <button type="button" className={child.go} onClick={() => navigate(`/learn/${learner.id}`)}>
              My games
              <NextIcon size={28} />
            </button>
          ) : null}
        </section>
      </div>
    )
  }
  return <Player key={lesson.data.id} lesson={lesson.data} learner={learner} voice={voice} bar={bar} celebrate={celebrate} reloadLearner={reloadLearner} />
}

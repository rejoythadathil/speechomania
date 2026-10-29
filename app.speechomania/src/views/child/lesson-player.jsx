import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { ACTIONS, Actor } from '@/components/child/actor.jsx'
import { BookIcon, NextIcon, RewardIcon } from '@/components/child/child-icons.jsx'
import { BottomBar, Steps, TopBar } from '@/components/child/chrome.jsx'
import { ReadAlong } from '@/components/child/read-along.jsx'
import { Scene, School, Tree } from '@/components/child/scene.jsx'
import child from '@/components/child/child.module.css'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { cx } from '@/utils/cx'
import styles from './lesson-player.module.css'

const LINES = {
  intro: { text: 'Let’s read together.' },
  quiz: { text: 'Now, show me.' },
  retry: { text: 'Let’s look again.' },
  skip: { text: 'Let’s try another.' },
  outro: { text: 'The end. Great reading!' },
  reward: { text: 'You earned a sticker!' }
}

const NARROW = '(max-width: 860px)'
const subscribe = (notify) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const isNarrow = () => window.matchMedia(NARROW).matches

function shuffle(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

function balancedSides(count) {
  for (;;) {
    const sides = shuffle(Array.from({ length: count }, (_, index) => (index % 2 ? 'left' : 'right')))
    if (!sides.some((side, index) => index >= 2 && sides[index - 1] === side && sides[index - 2] === side)) return sides
  }
}

function planPages(content) {
  const indexes = content.steps.map((_, index) => index)
  if (content.player !== 'pick') return indexes.map((index) => ({ step: 'story', index }))
  const round = (step) => {
    const order = shuffle(indexes)
    const sides = balancedSides(order.length)
    return order.map((index, position) => ({ step, index, side: sides[position] }))
  }
  return [...round('learn'), ...round('check')]
}

const isNegative = (word) => /n[’']t$/i.test(word ?? '')

function PickPage({ page, number, content, lines, voice, narrow, onAnswered, onReady }) {
  const step = content.steps[page.index]
  const other = step.choices.find((id) => id !== step.answer)
  const [phase, setPhase] = useState('asking')
  const wrongs = useRef(0)
  const shownAt = useRef(performance.now())
  const closed = useRef(false)
  const { speak } = voice
  const positions = narrow ? { left: 26, right: 74 } : { left: 31, right: 69 }
  const wrongSide = page.side === 'left' ? 'right' : 'left'
  const at = { [page.side]: step.answer, [wrongSide]: other }

  useEffect(() => {
    let active = true
    const intro = number === 0 ? lines.intro : page.step === 'check' && page.firstCheck ? lines.quiz : null
    ;(async () => {
      if (intro) await speak(intro)
      if (active && !closed.current) speak(step)
    })()
    return () => {
      active = false
    }
  }, [lines, number, page, speak, step])

  function finish(outcome, line) {
    closed.current = true
    setPhase(outcome)
    onAnswered({ step: page.step, index: page.index, correct: outcome === 'right', wrongs: wrongs.current, latency_ms: Math.round(performance.now() - shownAt.current) })
    speak(line).then(onReady)
  }

  function tap(side) {
    if (closed.current) return
    if (at[side] === step.answer) return finish('right', step.praise)
    wrongs.current += 1
    if (page.step === 'check') return finish('skip', lines.skip)
    if (wrongs.current > 1) return finish('reveal', step.teach)
    setPhase('again')
    speak(lines.retry).then(() => !closed.current && speak(step))
  }

  const revealed = phase === 'right' || phase === 'reveal'
  const action = ACTIONS[step.act]
  const actorSide = at.left === step.actor ? 'left' : 'right'
  const actorLeft = positions[actorSide] + (revealed && action.prop === 'school' ? (actorSide === 'left' ? -4 : 4) : 0)
  const negative = isNegative(content.contrast)

  return (
    <Scene morning={revealed && action.morning}>
        {revealed && action.prop === 'tree' ? <Tree left={actorLeft} /> : null}
        {revealed && action.prop === 'school' ? <School left={actorLeft + (actorSide === 'left' ? -10 : 10)} /> : null}
        {['left', 'right'].map((side) => {
          const character = at[side]
          const isActor = character === step.actor
          return (
            <Actor
              key={side}
              character={character}
              left={isActor ? actorLeft : positions[side]}
              action={revealed && isActor ? step.act : null}
              asleep={revealed && !isActor && action.morning}
              hint={phase === 'again' && side === page.side}
              dim={revealed && !isActor && character !== step.answer}
              ring={revealed && character === step.answer ? { colour: negative ? 'var(--child-coral)' : 'var(--child-blue-500)', negative, label: content.contrast ?? 'Yes' } : null}
              onTap={phase === 'asking' || phase === 'again' ? () => tap(side) : undefined}
              label={`The ${character}`}
            />
          )
      })}
    </Scene>
  )
}

function StoryPage({ page, number, content, lines, voice, onAnswered, onReady }) {
  const step = content.steps[page.index]
  const { speak } = voice
  useEffect(() => {
    let active = true
    const shownAt = performance.now()
    ;(async () => {
      if (number === 0) await speak(lines.intro)
      if (!active) return
      await speak(step)
      if (!active) return
      onAnswered({ step: 'story', index: page.index, correct: true, wrongs: 0, latency_ms: Math.round(performance.now() - shownAt) })
      onReady()
    })()
    return () => {
      active = false
    }
  }, [lines, number, onAnswered, onReady, page, speak, step])
  return <Scene />
}

function Player({ lesson, learner, voice, bar, reloadLearner }) {
  const navigate = useNavigate()
  const narrow = useSyncExternalStore(subscribe, isNarrow)
  const content = lesson.content
  const pick = content.player === 'pick'
  const lines = useMemo(() => ({ ...LINES, ...content.lines }), [content.lines])
  const [pages, setPages] = useState(null)
  const [at, setAt] = useState(0)
  const [ready, setReady] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const attempt = useRef(null)
  const queue = useRef(Promise.resolve())
  const answers = useRef([])
  const { speak, stop } = voice

  useEffect(() => {
    if (!pages) speak({ text: lesson.title })
  }, [lesson.title, pages, speak])

  const send = useCallback((body) => {
    const id = attempt.current
    queue.current = queue.current.then(() => api(`/learning/attempts/${id}`, { method: 'PATCH', body })).catch(() => null)
    return queue.current
  }, [])

  async function open() {
    setError(null)
    try {
      attempt.current = (await api(`/learning/children/${learner.id}/attempts`, { method: 'POST', body: { lesson_id: lesson.id } })).id
    } catch (caught) {
      setError(caught.message)
      return
    }
    answers.current = []
    const plan = planPages(content)
    const firstCheck = plan.findIndex((page) => page.step === 'check')
    if (firstCheck >= 0) plan[firstCheck] = { ...plan[firstCheck], firstCheck: true }
    setResult(null)
    setReady(false)
    setAt(0)
    setPages(plan)
  }

  const answered = useCallback((event) => {
    answers.current = [...answers.current, event]
    send({ events: [event], steps_completed: answers.current.length })
  }, [send])

  const markReady = useCallback(() => setReady(true), [])

  async function next() {
    stop()
    setReady(false)
    if (at + 1 < pages.length) return setAt(at + 1)
    const saved = await send({ events: [], steps_completed: pages.length, completed: true })
    const checks = answers.current.filter((event) => event.step === 'check')
    const stars = saved?.stars ?? checks.filter((event) => event.correct && !event.wrongs).length
    const sticker = pick ? stars >= Math.ceil(checks.length * 0.9) : true
    setResult({ stars, checks, sticker })
    setPages(null)
    reloadLearner()
    await speak(lines.outro)
    if (sticker) speak(lines.reward)
  }

  const page = pages?.[at]
  const labels = pick ? ['Learn', 'Show me', 'Done'] : ['Read', 'Done']
  const current = result ? labels.length - 1 : !page ? -1 : page.step === 'check' ? 1 : 0
  const sameStep = page ? pages.filter((item) => item.step === page.step) : []
  const step = page ? content.steps[page.index] : null
  const cover = pick ? content.steps[0].choices : null

  return (
    <>
      {page ? (
        pick
          ? <PickPage key={at} page={page} number={at} content={content} lines={lines} voice={voice} narrow={narrow} onAnswered={answered} onReady={markReady} />
          : <StoryPage key={at} page={page} number={at} content={content} lines={lines} voice={voice} onAnswered={answered} onReady={markReady} />
      ) : (
        <Scene>
          {cover ? cover.map((id, index) => <Actor key={id} character={id} left={narrow ? (index ? 74 : 26) : (index ? 69 : 31)} label={`The ${id}`} />) : null}
        </Scene>
      )}
      <TopBar {...bar} centre={<Steps steps={labels} current={current} count={page ? `${sameStep.indexOf(page) + 1} / ${sameStep.length}` : null} />} />

      {page ? (
        <section className={cx(child.card, child.caption)} aria-live="polite">
          <span className={child.kicker}>{page.step === 'check' ? 'Show me' : page.step === 'learn' ? 'Learn' : lesson.title}</span>
          <ReadAlong text={voice.text || step.text} wordIndex={voice.wordIndex} contrast={content.contrast} />
        </section>
      ) : null}

      {!page && !result ? (
        <section className={cx(child.card, styles.cover)}>
          <span className={child.kicker}>Book</span>
          <h1>{lesson.title}</h1>
          <p>{pick ? `${content.steps.length} pages to learn, then ${content.steps.length} to show me.` : `${content.steps.length} pages to read.`}</p>
          {error ? <p className={child.error} role="alert">{error}</p> : null}
        </section>
      ) : null}

      {result ? (
        <section className={cx(child.card, styles.end)}>
          {result.sticker ? <RewardIcon size={120} /> : <BookIcon size={96} />}
          <h1>The end</h1>
          <ReadAlong text={voice.text || lines.outro.text} wordIndex={voice.wordIndex} />
          {pick ? (
            <>
              <p>{result.stars} of {result.checks.length} in Show me</p>
              <div className={styles.score} aria-hidden="true">
                {result.checks.map((event, index) => <i key={index} className={cx(event.correct && !event.wrongs && styles.scoreOn)} />)}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <BottomBar
        onSayAgain={voice.replay}
        next={page ? (
          <button type="button" className={cx(child.go, !ready && child.hidden)} onClick={next} disabled={!ready} aria-hidden={!ready}>
            Next
            <NextIcon size={28} />
          </button>
        ) : result ? (
          <span className={styles.endActions}>
            <button type="button" className={child.pill} onClick={() => navigate(`/learn/${learner.id}`)}>My books</button>
            <button type="button" className={child.go} onClick={open} autoFocus>
              Read again
              <NextIcon size={28} />
            </button>
          </span>
        ) : (
          <button type="button" className={child.go} onClick={open} autoFocus>
            Open the book
            <NextIcon size={28} />
          </button>
        )}
      />
    </>
  )
}

export function LessonPlayerView() {
  const { learner, voice, bar, reloadLearner } = useOutletContext()
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = useResource(`/learning/children/${learner.id}/lessons/${lessonId}`)

  if (!lesson.data) {
    return (
      <>
        <Scene />
        <TopBar {...bar} />
        <section className={cx(child.card, styles.cover)} role={lesson.error ? 'alert' : 'status'}>
          <h1>{lesson.error ? 'This book isn’t on your shelf.' : 'Opening your book…'}</h1>
          {lesson.error ? (
            <button type="button" className={child.go} onClick={() => navigate(`/learn/${learner.id}`)}>
              My books
              <NextIcon size={28} />
            </button>
          ) : null}
        </section>
      </>
    )
  }
  return <Player key={lesson.data.id} lesson={lesson.data} learner={learner} voice={voice} bar={bar} reloadLearner={reloadLearner} />
}

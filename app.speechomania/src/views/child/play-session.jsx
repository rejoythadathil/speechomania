import { useCallback, useRef, useState } from 'react'
import { ART } from '@/components/child/art.jsx'
import { NextIcon } from '@/components/child/child-icons.jsx'
import { BottomBar, TopBar } from '@/components/child/chrome.jsx'
import { ReadAlong } from '@/components/child/read-along.jsx'
import { sceneFor } from '@/components/child/scenes.js'
import { Scenery } from '@/components/child/scenery.jsx'
import child from '@/components/child/child.module.css'
import { cx } from '@/utils/cx'
import { GAMES, shuffle } from './games/index.js'
import { tallyOf } from './games/use-round.js'
import styles from './lesson-player.module.css'
import { RewardReveal } from './reward-reveal.jsx'

const PAIRS_PER_BOARD = 3

export const LINES = {
  intro: null,
  quiz: { text: 'Now, show me.' },
  retry: { text: 'Let’s look again.' },
  skip: { text: 'Let’s try another.' },
  yes: { text: 'Yes!' },
  outro: { text: 'You did it!' },
  reward: { text: 'You earned a trophy!' },
  medal: { text: 'You earned a medal!' },
  sticker: { text: 'You earned a star! Let’s play again.' }
}

export function prizeOf(got, total) {
  if (!total) return { art: 'trophy', title: 'You did it!', line: 'reward', big: true }
  const share = got / total
  if (share >= 0.9) return { art: 'trophy', title: 'Super star!', line: 'reward', big: true }
  if (share >= 0.6) return { art: 'medal', title: 'Well done!', line: 'medal', big: false }
  return { art: 'star', title: 'Good try!', line: 'sticker', big: false }
}

function balancedSides(count) {
  for (;;) {
    const sides = shuffle(
      Array.from({ length: count }, (_, index) => (index % 2 ? 'left' : 'right'))
    )
    if (
      !sides.some(
        (side, index) => index >= 2 && sides[index - 1] === side && sides[index - 2] === side
      )
    )
      return sides
  }
}

function quizPages(content, check) {
  const player = content.player ?? 'story'
  if (!check || player === 'story') return []
  const order = shuffle(content.steps.map((_, index) => index))
  if (player === 'match') {
    const group = order.slice(0, PAIRS_PER_BOARD)
    return group.length === PAIRS_PER_BOARD ? [{ step: 'quiz', index: group[0], group }] : []
  }
  const picked = order.slice(0, check.questions)
  const sides = balancedSides(picked.length)
  return picked.map((index, position) => ({ step: 'quiz', index, side: sides[position] }))
}

export function lessonPages(content, lines, { cards = [], check = null } = {}) {
  const player = content.player ?? 'story'
  const indexes = content.steps.map((_, index) => index)
  const data = (index) => ({
    step_data: content.steps[index],
    steps: content.steps,
    contrast: content.contrast,
    lines
  })
  let pages
  if (player === 'story') {
    pages = indexes.map((index) => ({ step: 'story', index }))
  } else if (player === 'pick') {
    const round = (step) => {
      const order = shuffle(indexes)
      const sides = balancedSides(order.length)
      return order.map((index, position) => ({ step, index, side: sides[position] }))
    }
    pages = cards.length ? round('check') : [...round('learn'), ...round('check')]
    const firstCheck = pages.findIndex((page) => page.step === 'check')
    if (!cards.length) pages[firstCheck] = { ...pages[firstCheck], intro: lines.quiz }
  } else if (player === 'match') {
    const order = shuffle(indexes)
    const boards = Math.floor(order.length / PAIRS_PER_BOARD)
    pages = Array.from({ length: Math.min(content.rounds ?? boards, boards) }, (_, board) => {
      const group = order.slice(board * PAIRS_PER_BOARD, (board + 1) * PAIRS_PER_BOARD)
      return { step: 'play', index: group[0], group }
    })
  } else {
    pages = shuffle(indexes)
      .slice(0, Math.min(content.rounds ?? indexes.length, indexes.length))
      .map((index) => ({ step: 'play', index }))
  }
  if (pages.length && lines.intro) pages[0] = { ...pages[0], intro: lines.intro }
  const learning = cards.map((card, index) => ({
    step: 'card',
    index,
    player: 'card',
    step_data: card,
    steps: [],
    lines
  }))
  const playing = [...pages, ...quizPages(content, check)].map((page) => ({
    ...page,
    player,
    ...data(page.index)
  }))
  return [...learning, ...playing]
}

const kindOf = (page) => (page.step === 'card' ? 'card' : page.step === 'quiz' ? 'quiz' : 'game')

export function assessmentPages(items, settings) {
  const order = items.map((_, index) => index)
  return (settings.shuffle ? shuffle(order) : order).map((index) => {
    const item = items[index]
    return {
      step: 'assess',
      index,
      player: item.player,
      side: Math.random() < 0.5 ? 'left' : 'right',
      tries: settings.tries,
      hints: settings.hints,
      step_data: item.step,
      steps: [item.step, ...(item.context ?? [])],
      contrast: item.contrast,
      lines: { ...LINES, ...item.lines }
    }
  })
}

function Progress({ pages: all, at: position }) {
  const kind = kindOf(all[position])
  const pages = all.filter((page) => kindOf(page) === kind)
  const at = all.slice(0, position).filter((page) => kindOf(page) === kind).length
  return (
    <ol className={styles.progress} aria-label={`Round ${at + 1} of ${pages.length}`}>
      {pages.map((page, index) => (
        <li
          key={index}
          className={cx(
            index < at && styles.done,
            index === at && styles.now,
            page.step === 'check' && styles.check
          )}
        >
          <img src={ART.star} alt="" draggable="false" />
        </li>
      ))}
    </ol>
  )
}

export function PlaySession({
  title,
  kicker,
  cover,
  lines,
  plan,
  start,
  send,
  summarise,
  onLeave,
  leaveLabel,
  voice,
  bar,
  celebrate
}) {
  const [pages, setPages] = useState(null)
  const [at, setAt] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const answers = useRef([])
  const { speak, stop } = voice

  async function open() {
    setError(null)
    celebrate.reset()
    try {
      await start()
    } catch (caught) {
      setError(caught.message)
      return
    }
    answers.current = []
    setResult(null)
    setWaiting(false)
    setAt(0)
    setPages(plan())
  }

  const finish = useCallback(
    async (total) => {
      const saved = await send({ events: [], steps_completed: total, completed: true })
      const summary = summarise(saved, answers.current)
      const prize = prizeOf(summary.got, summary.total)
      setResult({ ...summary, prize })
      setPages(null)
      if (lines.outro) await speak(lines.outro)
      const reward = lines[prize.line] ?? lines.reward
      if (reward) speak(reward)
    },
    [lines, send, speak, summarise]
  )

  const done = useCallback(
    (outcome) => {
      const page = pages[at]
      if (page.step === 'card') return setWaiting(true)
      const event = { step: page.step, index: page.index, ...outcome }
      answers.current = [...answers.current, event]
      send({ events: [event], steps_completed: answers.current.length })
      if (page.step === 'story') return setWaiting(true)
      if (at + 1 < pages.length) return setAt(at + 1)
      finish(pages.length)
    },
    [at, finish, pages, send]
  )

  function next() {
    stop()
    setWaiting(false)
    if (at + 1 < pages.length) return setAt(at + 1)
    finish(pages.length)
  }

  const page = pages?.[at]
  const step = page?.step_data ?? null
  const scene = sceneFor(page?.player ?? cover.player)
  const Game = page ? (GAMES[page.player] ?? GAMES.story) : null

  return (
    <div className={styles.root} style={{ background: scene.background }}>
      <Scenery player={page?.player ?? cover.player} />
      {page ? (
        <Game
          key={at}
          page={page}
          step={step}
          steps={page.steps}
          contrast={page.contrast}
          lines={page.lines}
          voice={voice}
          celebrate={celebrate}
          tally={tallyOf(answers.current)}
          onDone={done}
        />
      ) : null}
      <TopBar {...bar} centre={page ? <Progress pages={pages} at={at} /> : null} />

      {page && page.step !== 'card' ? (
        <section className={cx(child.card, child.caption)} aria-live="polite">
          <span className={child.kicker}>
            {page.step === 'learn'
              ? 'Learn'
              : page.step === 'check'
                ? 'Show me'
                : page.step === 'quiz'
                  ? 'Quick check'
                  : kicker}
          </span>
          <ReadAlong
            text={voice.text || (page.group ? (page.lines.quiz?.text ?? '') : step.text)}
            wordIndex={voice.wordIndex}
            contrast={page.contrast}
          />
        </section>
      ) : null}

      {!page && !result ? (
        <section className={styles.cover}>
          <div className={styles.hero} aria-hidden="true">
            {cover.scene ? (
              <img className={styles.heroScene} src={cover.scene} alt="" draggable="false" />
            ) : (
              cover.art.map((name) => <img key={name} src={ART[name]} alt="" draggable="false" />)
            )}
          </div>
          <div className={cx(child.card, styles.intro)}>
            <h1>{title}</h1>
            {cover.intro ? <p>{cover.intro}</p> : null}
            <ol className={styles.how} aria-label="How to play">
              {cover.how.map(([name, label]) => (
                <li key={label}>
                  <img src={ART[name]} alt="" draggable="false" />
                  {label}
                </li>
              ))}
            </ol>
            {error ? (
              <p className={child.error} role="alert">
                {error}
              </p>
            ) : null}
            <button type="button" className={child.go} onClick={open} autoFocus>
              Play
              <NextIcon size={28} />
            </button>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className={cx(child.card, styles.panel)}>
          <RewardReveal result={result} player={cover.player} celebrate={celebrate} />
          {result.check ? (
            <p className={styles.check}>
              Quick check: {result.check.right} of {result.check.total}
            </p>
          ) : null}
          <span className={styles.actions}>
            <button type="button" className={child.pill} onClick={onLeave}>
              {leaveLabel}
            </button>
            {result.again === false ? null : (
              <button type="button" className={child.go} onClick={open} autoFocus>
                Play again
                <NextIcon size={28} />
              </button>
            )}
          </span>
        </section>
      ) : null}

      <BottomBar
        onSayAgain={page ? voice.replay : null}
        next={
          page?.step === 'story' || page?.step === 'card' ? (
            <button
              type="button"
              className={cx(child.go, !waiting && child.hidden)}
              onClick={next}
              disabled={!waiting}
              aria-hidden={!waiting}
            >
              Next
              <NextIcon size={28} />
            </button>
          ) : null
        }
      />
    </div>
  )
}

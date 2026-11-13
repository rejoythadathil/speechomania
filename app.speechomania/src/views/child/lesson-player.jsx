import { useCallback, useMemo, useRef } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { GAME_ART, GAME_SCENES } from '@/components/child/art.jsx'
import { NextIcon } from '@/components/child/child-icons.jsx'
import { TopBar } from '@/components/child/chrome.jsx'
import { sceneFor } from '@/components/child/scenes.js'
import child from '@/components/child/child.module.css'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { cx } from '@/utils/cx'
import { LINES, PlaySession, lessonPages } from './play-session.jsx'
import styles from './lesson-player.module.css'

const scored = (answers) =>
  answers.filter((event) => event.step === 'play' || event.step === 'check')

export function checkScore(answers) {
  const quiz = answers.filter((event) => event.step === 'quiz')
  if (!quiz.length) return null
  return {
    right: quiz.filter((event) => event.correct && !event.wrongs).length,
    total: quiz.length
  }
}

export function lessonCover(lesson, lines) {
  const player = lesson.content.player ?? 'story'
  return {
    player,
    art: GAME_ART[player] ?? GAME_ART.story,
    scene: GAME_SCENES[player],
    intro: lines.intro?.text,
    how: sceneFor(player).how
  }
}

export function useAttempt(start) {
  const attempt = useRef(null)
  const queue = useRef(Promise.resolve())
  const open = useCallback(async () => {
    attempt.current = (await start()).id
  }, [start])
  const send = useCallback((body) => {
    const id = attempt.current
    queue.current = queue.current
      .then(() => api(`/learning/attempts/${id}`, { method: 'PATCH', body }))
      .catch(() => null)
    return queue.current
  }, [])
  return { open, send }
}

function Player({ lesson, learner, voice, bar, celebrate, reloadLearner }) {
  const navigate = useNavigate()
  const lines = useMemo(() => ({ ...LINES, ...lesson.content.lines }), [lesson.content.lines])
  const start = useCallback(
    () =>
      api(`/learning/children/${learner.id}/attempts`, {
        method: 'POST',
        body: { lesson_id: lesson.id }
      }),
    [learner.id, lesson.id]
  )
  const attempt = useAttempt(start)
  const summarise = useCallback(
    (saved, answers) => {
      reloadLearner()
      const counted = scored(answers)
      return {
        got: saved?.stars ?? counted.filter((event) => event.correct && !event.wrongs).length,
        total: counted.length,
        check: checkScore(answers),
        reward: saved?.reward ?? null
      }
    },
    [reloadLearner]
  )

  return (
    <PlaySession
      title={lesson.title}
      kicker={lesson.title}
      cover={lessonCover(lesson, lines)}
      lines={lines}
      plan={() => lessonPages(lesson.content, lines, { cards: lesson.cards, check: lesson.check })}
      start={attempt.open}
      send={attempt.send}
      summarise={summarise}
      onLeave={() => navigate(`/learn/${learner.id}`)}
      leaveLabel="My games"
      voice={voice}
      bar={bar}
      celebrate={celebrate}
    />
  )
}

export function PlayLoading({ bar, error, missing, onBack }) {
  return (
    <div className={styles.root}>
      <TopBar {...bar} onBack={onBack} />
      <section className={cx(child.card, styles.panel)} role={error ? 'alert' : 'status'}>
        <h1>{error ? missing : 'Getting your game ready…'}</h1>
        {error ? (
          <button type="button" className={child.go} onClick={onBack}>
            My games
            <NextIcon size={28} />
          </button>
        ) : null}
      </section>
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
      <PlayLoading
        bar={bar}
        error={lesson.error}
        missing="This game isn’t on your map."
        onBack={() => navigate(`/learn/${learner.id}`)}
      />
    )
  }
  return (
    <Player
      key={lesson.data.id}
      lesson={lesson.data}
      learner={learner}
      voice={voice}
      bar={bar}
      celebrate={celebrate}
      reloadLearner={reloadLearner}
    />
  )
}

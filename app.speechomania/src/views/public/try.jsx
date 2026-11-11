import { useState } from 'react'
import { Link } from 'react-router'
import { GAME_SCENES } from '@/components/child/art.jsx'
import { SCENES } from '@/components/child/scenes.js'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { cx } from '@/utils/cx'
import { LessonPreview } from '@/views/child/preview-player.jsx'
import styles from './landing.module.css'
import { PublicHeader } from './public-header.jsx'

const PLAYED_KEY = 'speechomania:free-played'

function readPlayed() {
  try {
    return JSON.parse(localStorage.getItem(PLAYED_KEY)) ?? []
  } catch {
    return []
  }
}

function savePlayed(list) {
  try {
    localStorage.setItem(PLAYED_KEY, JSON.stringify(list))
  } catch {
    return
  }
}

export function TryView() {
  const free = useResource('/showcase/free', { page_size: 10 })
  const summary = useResource('/showcase')
  const [played, setPlayed] = useState(readPlayed)
  const [lesson, setLesson] = useState(null)
  const [opening, setOpening] = useState(null)
  const [failed, setFailed] = useState(false)
  const items = free.data?.items ?? []
  const done = items.length > 0 && items.every((item) => played.includes(item.slug))
  const left = items.filter((item) => !played.includes(item.slug)).length

  async function open(slug) {
    setOpening(slug)
    setFailed(false)
    try {
      setLesson(await api(`/showcase/free/${slug}`))
    } catch {
      setFailed(true)
    } finally {
      setOpening(null)
    }
  }

  function close() {
    const next = played.includes(lesson.slug) ? played : [...played, lesson.slug]
    setPlayed(next)
    savePlayed(next)
    setLesson(null)
  }

  return (
    <div className={styles.page}>
      <PublicHeader nav={false} tryLink={false} />
      <main>
        <section className={styles.tryHero}>
          <div className={styles.wrap}>
            <span className={styles.label}>Try for free</span>
            <h1>Play a game with your child, no account needed.</h1>
            <p className={styles.sub}>
              Turn the sound on. Each game reads every word aloud and takes a few minutes.
            </p>
          </div>
        </section>

        <div className={styles.wrap}>
          {failed ? (
            <p className={styles.notice} role="alert">
              We could not open that game. Check your connection and try again.
            </p>
          ) : null}
          <div className={styles.tryGrid} aria-busy={free.loading}>
            {free.loading
              ? [0, 1].map((key) => <span key={key} className={styles.ghostCard} />)
              : items.map((item) => {
                  const wasPlayed = played.includes(item.slug)
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      className={cx(styles.game, styles.gameButton)}
                      disabled={opening === item.slug || done}
                      onClick={() => open(item.slug)}
                    >
                      <span className={styles.media}>
                        <img src={GAME_SCENES[item.player]} alt="" />
                        {wasPlayed ? <span className={styles.badge}>Played</span> : null}
                      </span>
                      <span className={styles.gameBody}>
                        <span className={styles.skill}>{item.skill}</span>
                        <span className={styles.gameName}>{SCENES[item.player]?.tag}</span>
                        <span className={styles.example}>
                          {opening === item.slug
                            ? 'Opening…'
                            : done
                              ? 'Sign up to play again.'
                              : wasPlayed
                                ? 'Play again'
                                : 'Tap to play'}
                        </span>
                      </span>
                    </button>
                  )
                })}
          </div>

          <section className={styles.gate} aria-live="polite">
            <h2>{done ? 'You’ve played the free games.' : 'Want every game?'}</h2>
            <p>
              {done
                ? 'Sign up to keep playing.'
                : `${left} free ${left === 1 ? 'game' : 'games'} left to try.`}{' '}
              {summary.data
                ? `An account opens all ${summary.data.games} games and ${summary.data.flashcards} flashcards, with stars, medals and animal friends to collect.`
                : null}
            </p>
            <div className={styles.ctas}>
              <Link className={cx(styles.btn, styles.primary)} to="/start">
                Sign up
              </Link>
              <Link className={cx(styles.btn, styles.ghost)} to="/login">
                I have an account
              </Link>
            </div>
          </section>
        </div>
      </main>

      {lesson ? (
        <LessonPreview lesson={lesson} onClose={close} kicker="Free game" leaveLabel="Done" />
      ) : null}
    </div>
  )
}

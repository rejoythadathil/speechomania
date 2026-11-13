import { useDeferredValue, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { ART, GAME_ART, avatarFor } from '@/components/child/art.jsx'
import {
  BackIcon,
  BreakIcon,
  GrownUpIcon,
  MuteIcon,
  NextIcon,
  SayAgainIcon,
  SearchIcon
} from '@/components/child/child-icons.jsx'
import { GameThumb } from '@/components/child/game-thumb.jsx'
import { sceneFor } from '@/components/child/scenes.js'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import styles from './learn-home.module.css'

const PAGE_SIZE = 6
const CHECKINS_PER_PAGE = 3
const SHOWS = [
  ['all', 'All'],
  ['new', 'New'],
  ['played', 'Played'],
  ['cards', 'Flashcards'],
  ['games', 'Games']
]

function rating(lesson) {
  if (!lesson.times_completed) return 0
  const share = lesson.best_stars / Math.max(lesson.max_stars, 1)
  return share >= 0.9 ? 3 : share >= 0.6 ? 2 : 1
}

const gameArt = (game) =>
  ['pick', 'cards'].includes(game.player) && game.cover
    ? game.cover[0]
    : (GAME_ART[game.player] ?? GAME_ART.story)[0]

function Stat({ art, label, value, of }) {
  return (
    <li className={styles.stat}>
      <img src={ART[art]} alt="" draggable="false" />
      <span className={styles.statText}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>
          {value}
          {of !== undefined ? <small> of {of}</small> : null}
        </span>
      </span>
    </li>
  )
}

const PRIZES = [null, null, 'medal', 'trophy']

function GameCard({ lesson, next, onOpen }) {
  const stars = rating(lesson)
  const scene = sceneFor(lesson.player)
  const locked = lesson.locked_after
  return (
    <button
      type="button"
      className={cx(styles.card, next && styles.nextCard, locked && styles.lockedCard)}
      style={{ '--accent': scene.accent }}
      onClick={onOpen}
      disabled={Boolean(locked)}
      aria-label={locked ? `${lesson.title}. Finish ${locked.title} first.` : undefined}
    >
      <span className={styles.picture}>
        <GameThumb player={lesson.player} cover={lesson.cover} />
        {locked ? (
          <span className={styles.lock}>
            <GrownUpIcon size={56} />
          </span>
        ) : next ? (
          <span className={styles.playNext}>Play next</span>
        ) : !lesson.times_completed ? (
          <img className={styles.fresh} src={ART.new} alt="New" draggable="false" />
        ) : null}
      </span>
      <span className={styles.meta}>
        <span className={styles.title}>{lesson.title}</span>
        <span className={styles.foot}>
          <span className={styles.tag}>{scene.tag}</span>
          {locked ? (
            <span className={styles.after}>Finish {locked.title} first</span>
          ) : (
            <span className={styles.prize}>
              {PRIZES[stars] ? (
                <img src={ART[PRIZES[stars]]} alt={PRIZES[stars]} draggable="false" />
              ) : null}
              <span
                className={styles.stars}
                aria-label={lesson.times_completed ? `${stars} of 3 stars` : 'Not played yet'}
              >
                {[0, 1, 2].map((index) => (
                  <img
                    key={index}
                    className={cx(index < stars && styles.got)}
                    src={ART.star}
                    alt=""
                    draggable="false"
                  />
                ))}
              </span>
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

function CheckinCard({ checkin, onOpen }) {
  return (
    <button
      type="button"
      className={cx(styles.card, !checkin.done && styles.nextCard)}
      onClick={onOpen}
      disabled={!checkin.can_start}
    >
      <span className={styles.picture}>
        <GameThumb player={checkin.players[0] ?? 'story'} />
        {checkin.done ? null : <span className={styles.playNext}>Ready</span>}
      </span>
      <span className={styles.meta}>
        <span className={styles.title}>{checkin.title}</span>
        <span className={styles.foot}>
          <span className={styles.tag}>{checkin.done ? 'Done' : 'Check-in'}</span>
          <span className={styles.count}>
            {checkin.score
              ? `${checkin.score.score} of ${checkin.score.max_score}`
              : `${checkin.question_count} questions`}
          </span>
        </span>
      </span>
    </button>
  )
}

function Pager({ data, page, setPage, label }) {
  if (!data || data.total_pages <= 1) return null
  return (
    <nav className={styles.pager} aria-label={label}>
      <button
        type="button"
        onClick={() => setPage((current) => current - 1)}
        disabled={page === 1}
        aria-label="Back"
      >
        <BackIcon size={22} />
      </button>
      <span>
        {page} / {data.total_pages}
      </span>
      <button
        type="button"
        onClick={() => setPage((current) => current + 1)}
        disabled={page >= data.total_pages}
        aria-label={label}
      >
        <NextIcon size={22} />
      </button>
    </nav>
  )
}

export function LearnHomeView() {
  const { learner, bar } = useOutletContext()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [checkPage, setCheckPage] = useState(1)
  const checkins = useResource(`/learning/children/${learner.id}/assessments`, {
    page: checkPage,
    page_size: CHECKINS_PER_PAGE
  })
  const [search, setSearch] = useState('')
  const [show, setShow] = useState('all')
  const q = useDeferredValue(search.trim())
  const shelf = useResource(`/learning/children/${learner.id}/lessons`, {
    page,
    page_size: PAGE_SIZE,
    q,
    show
  })
  const filtered = Boolean(q) || show !== 'all'
  const games = shelf.data?.items ?? []
  const next = games.find((lesson) => !lesson.times_completed && !lesson.locked_after) ?? null
  const toTry = learner.games_total - learner.games_played

  return (
    <div className={styles.root}>
      <header className={styles.bar}>
        <span className={styles.actions}>
          <button type="button" className={styles.action} onClick={bar.onGrownUp}>
            <BackIcon size={22} />
            <span>Back</span>
          </button>
          <span className={styles.brand}>
            <BrandMark size={30} />
            <b>Speechomania</b>
          </span>
        </span>
        <span className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={bar.onMute}
            aria-pressed={bar.muted}
            aria-label={bar.muted ? 'Sound is off' : 'Sound is on'}
          >
            {bar.muted ? <MuteIcon size={22} /> : <SayAgainIcon size={22} />}
          </button>
          <button type="button" className={styles.action} onClick={bar.onBreak}>
            <BreakIcon size={20} />
            <span>Break</span>
          </button>
          <button type="button" className={styles.action} onClick={bar.onGrownUp}>
            <GrownUpIcon size={22} />
            <span>Parent</span>
          </button>
        </span>
      </header>

      <main className={styles.scroll}>
        <div className={styles.unit}>
          <section className={styles.head}>
            <div className={styles.hello}>
              <img src={ART[avatarFor(learner.id)]} alt="" draggable="false" />
              <div>
                <h1>Hi, {learner.display_name}!</h1>
                <p>
                  {toTry
                    ? `${toTry} new ${toTry === 1 ? 'game' : 'games'} to try`
                    : 'Every game played. Go for more stars!'}
                </p>
              </div>
            </div>
            <ul className={styles.stats}>
              <Stat art="star" label="Stars" value={learner.stars} />
              <Stat
                art="medal"
                label="Badges"
                value={learner.badges.length}
                of={learner.games_total}
              />
              <Stat
                art="check-mark"
                label="Played"
                value={learner.games_played}
                of={learner.games_total}
              />
            </ul>
          </section>

          <div className={styles.body}>
            <div className={styles.games}>
              {checkins.data?.items.length ? (
                <section className={styles.checkins} aria-labelledby="checkins-title">
                  <div className={styles.sectionHead}>
                    <h2 id="checkins-title">Check-ins</h2>
                    <Pager
                      data={checkins.data}
                      page={checkPage}
                      setPage={setCheckPage}
                      label="More check-ins"
                    />
                  </div>
                  <ul className={styles.grid} aria-label="My check-ins">
                    {checkins.data.items.map((checkin) => (
                      <li key={checkin.id}>
                        <CheckinCard
                          checkin={checkin}
                          onOpen={() => navigate(`assessments/${checkin.id}`)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section aria-labelledby="games-title">
                <div className={styles.sectionHead}>
                  <h2 id="games-title">Let’s play!</h2>
                  <Pager data={shelf.data} page={page} setPage={setPage} label="More games" />
                </div>
                {shelf.error ? (
                  <p className={styles.note} role="alert">
                    {shelf.error.message}
                  </p>
                ) : null}
                <div className={styles.filters}>
                  <label className={styles.search}>
                    <SearchIcon size={24} />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                      }}
                      placeholder="Find a game"
                      aria-label="Find a game"
                    />
                  </label>
                  <div className={styles.chips} role="group" aria-label="Show">
                    {SHOWS.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={styles.chip}
                        aria-pressed={show === value}
                        onClick={() => {
                          setShow(value)
                          setPage(1)
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {shelf.data && !games.length ? (
                  <p className={styles.note}>
                    {filtered
                      ? 'No games here. Try another word or tap All.'
                      : 'No games yet. New games are coming soon.'}
                  </p>
                ) : null}
                {games.length ? (
                  <ul className={styles.grid} aria-label="My games">
                    {games.map((lesson) => (
                      <li key={lesson.id}>
                        <GameCard
                          lesson={lesson}
                          next={lesson === next}
                          onOpen={() => navigate(`lessons/${lesson.id}`)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </div>

            <aside className={styles.side} aria-labelledby="trophies-title">
              <div className={styles.sectionHead}>
                <h2 id="trophies-title">My trophies</h2>
                <span className={styles.count}>
                  {learner.trophies.filter((game) => game.prize).length} of {learner.games_total}
                </span>
              </div>
              {learner.trophies.length ? (
                <ul className={styles.shelf}>
                  {learner.trophies.map((game) => (
                    <li
                      key={game.slug}
                      className={cx(styles.shelfItem, !game.prize && styles.shelfEmpty)}
                    >
                      <span
                        className={styles.shelfArt}
                        style={{ background: sceneFor(game.player).background }}
                      >
                        <img src={ART[gameArt(game)]} alt="" draggable="false" loading="lazy" />
                        {game.prize ? (
                          <img
                            className={styles.shelfPrize}
                            src={ART[game.prize]}
                            alt={game.prize}
                            draggable="false"
                          />
                        ) : null}
                      </span>
                      <span className={styles.shelfTitle}>{game.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.note}>Play a game to win your first trophy.</p>
              )}
              <div className={cx(styles.sectionHead, styles.friendsHead)}>
                <h2 id="friends-title">My friends</h2>
                <span className={styles.count}>
                  {learner.friends.earned.length} of {learner.friends.total}
                </span>
              </div>
              <ul className={styles.friends} aria-labelledby="friends-title">
                {learner.friends.earned.map((name) => (
                  <li key={name} className={styles.friend}>
                    <img src={ART[name]} alt={name} draggable="false" loading="lazy" />
                  </li>
                ))}
                {learner.friends.next ? (
                  <li className={cx(styles.friend, styles.nextFriend)}>
                    <img src={ART[learner.friends.next]} alt="" draggable="false" loading="lazy" />
                    <span>{learner.friends.stars_to_next} more stars</span>
                  </li>
                ) : null}
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

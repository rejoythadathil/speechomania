import { Link } from 'react-router'
import { ART, GAME_ART, GAME_SCENES } from '@/components/child/art.jsx'
import { SCENES } from '@/components/child/scenes.js'
import { NUDGE_EVERY, PLAY_LIMIT, REST } from '@/components/child/use-screen-time.js'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import styles from './landing.module.css'

const PLAYERS = [
  'shark',
  'balloons',
  'place',
  'compare',
  'bubbles',
  'train',
  'pick',
  'yesno'
].filter((player) => GAME_SCENES[player])
const MINUTES = 60000
const bare = (word) => word.toLowerCase().replace(/[^a-z’']/g, '')
const percent = (share) => `${Math.round(share * 100)}%`

function Sentence({ example }) {
  const keys = example.keys.map((key) => key.toLowerCase())
  return example.text.split(' ').map((word, index) => (
    <span key={index} className={cx(keys.includes(bare(word)) && styles.key)}>
      {index ? ' ' : ''}
      {word}
    </span>
  ))
}

function Flashcard({ example }) {
  const [thing, spot] = example.art
  const placed = example.layout !== 'row' && spot
  return (
    <div className={styles.flashcard}>
      {placed ? (
        <span className={styles.place}>
          <img className={styles.spot} src={ART[spot]} alt="" />
          <img
            className={cx(styles.thing, styles[`at-${example.layout.replace(/\s+/g, '-')}`])}
            src={ART[thing]}
            alt=""
          />
        </span>
      ) : (
        <span className={styles.row}>
          {example.art.map((name) =>
            ART[name] ? <img key={name} src={ART[name]} alt="" /> : null
          )}
        </span>
      )}
      <span className={styles.cardText}>
        <Sentence example={example} />
      </span>
    </div>
  )
}

function GameCard({ game }) {
  return (
    <Link
      className={styles.game}
      to="/login"
      aria-label={`${SCENES[game.player].tag}, ${game.skill}`}
    >
      <span className={styles.media}>
        <img src={GAME_SCENES[game.player]} alt="" loading="lazy" />
      </span>
      <span className={styles.gameBody}>
        <span className={styles.skill}>{game.skill}</span>
        <span className={styles.gameName}>{SCENES[game.player].tag}</span>
        {game.example ? <span className={styles.example}>“{game.example.text}”</span> : null}
      </span>
    </Link>
  )
}

export function LandingView() {
  const summary = useResource('/showcase')
  const games = useResource('/showcase/games', {
    players: PLAYERS.join(','),
    page_size: PLAYERS.length
  })
  const list = games.data?.items ?? []
  const card = list.find((game) => game.example?.layout !== 'row')?.example ?? list[0]?.example
  const more = summary.data && games.data ? summary.data.games - list.length : 0
  const rewards = summary.data
    ? [
        ['Star', 'each first-try answer'],
        ['Medal', `${percent(summary.data.medal_share)} of the stars`],
        ['Trophy', `${percent(summary.data.trophy_share)} of the stars`]
      ]
    : []

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.wrap}>
          <Link className={styles.brand} to="/">
            <BrandMark size={32} />
            Speechomania
          </Link>
          <nav className={styles.nav} aria-label="Main">
            <a href="#games">Games</a>
            <a href="#how">How it works</a>
            <a href="#who">Who it is for</a>
          </nav>
          <Link className={cx(styles.btn, styles.primary, styles.small)} to="/login">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <span className={styles.label}>Speech and language games for autistic children</span>
            <h1>Games that help children find their words.</h1>
            <p className={styles.sub}>
              Picture flashcards read aloud, then a game that uses the same words. Played at home,
              followed by a mentor.
            </p>
            <div className={styles.ctas}>
              <a className={cx(styles.btn, styles.primary)} href="#games">
                See the games
              </a>
              <a className={cx(styles.btn, styles.ghost)} href="#how">
                How it works
              </a>
            </div>
          </div>
        </section>

        <section className={styles.games} id="games" aria-busy={games.loading}>
          <div className={styles.wrap}>
            <div className={styles.grid}>
              {games.loading
                ? PLAYERS.map((player) => <span key={player} className={styles.ghostCard} />)
                : list.map((game) => <GameCard key={game.slug} game={game} />)}
            </div>
            {more > 0 ? (
              <p className={styles.more}>
                And {more} more {more === 1 ? 'lesson' : 'lessons'} inside.
              </p>
            ) : null}
          </div>
        </section>

        <section className={styles.section} id="how">
          <div className={styles.wrap}>
            <div className={styles.head}>
              <span className={styles.label}>How it works</span>
              <h2>Two parts and a reward, every time.</h2>
              <p className={styles.sub}>
                The same calm pattern in every lesson, so a child always knows what comes next.
              </p>
            </div>
            <div className={styles.steps}>
              <article className={styles.step}>
                <div className={styles.vis}>{card ? <Flashcard example={card} /> : null}</div>
                <div className={styles.stepBody}>
                  <span className={styles.label}>Part 1</span>
                  <h3>Flashcards</h3>
                  <p>One picture and one short sentence on each card, read aloud word by word.</p>
                </div>
              </article>
              <article className={styles.step}>
                <div className={styles.vis}>
                  <span className={styles.pair}>
                    {GAME_ART.shark.map((name) => (
                      <img key={name} src={ART[name]} alt="" />
                    ))}
                  </span>
                </div>
                <div className={styles.stepBody}>
                  <span className={styles.label}>Part 2</span>
                  <h3>A game with the same words</h3>
                  <p>A wrong tap gets gentle help and another try.</p>
                </div>
              </article>
              <article className={styles.step}>
                <div className={styles.vis}>
                  <span className={styles.prizes}>
                    {['star', 'medal', 'trophy'].map((name) => (
                      <img key={name} src={ART[name]} alt={name} />
                    ))}
                  </span>
                </div>
                <div className={styles.stepBody}>
                  <span className={styles.label}>The end</span>
                  <h3>A reward that is earned</h3>
                  <ul className={styles.rules}>
                    {rewards.map(([name, rule]) => (
                      <li key={name}>
                        <b>{name}</b>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>
            {summary.data ? (
              <div className={styles.friends}>
                <div>
                  <h3>A new friend every {summary.data.stars_per_friend} stars</h3>
                  <p>
                    Stars add up across every game. {summary.data.friends.length} animal friends to
                    collect.
                  </p>
                </div>
                <div className={styles.friendRow}>
                  {summary.data.friends
                    .slice(0, 10)
                    .map((name, index) =>
                      ART[name] ? (
                        <img
                          key={name}
                          className={cx(index >= 5 && styles.rest)}
                          src={ART[name]}
                          alt={name}
                          title={name}
                        />
                      ) : null
                    )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.section} id="who">
          <div className={styles.wrap}>
            <div className={styles.head}>
              <span className={styles.label}>Who it is for</span>
              <h2>Everyone around the child, on one platform.</h2>
            </div>
            <div className={styles.roles}>
              <article className={styles.role}>
                <h3>Families</h3>
                <ul>
                  <li>The child’s learning path opens as soon as you sign in.</li>
                  <li>
                    A check-in every {NUDGE_EVERY / MINUTES} minutes, and a {REST / MINUTES} minute
                    rest after {PLAY_LIMIT / MINUTES} minutes of play.
                  </li>
                  <li>Notes from the mentor.</li>
                </ul>
              </article>
              <article className={styles.role}>
                <h3>Mentors</h3>
                <ul>
                  <li>Every game each child plays: right answers, tries and time.</li>
                  <li>Notes for the family, or for the team.</li>
                  <li>Assessments and lesson suggestions.</li>
                </ul>
              </article>
              <article className={styles.role}>
                <h3>Centres</h3>
                <ul>
                  <li>Enrol children and give each one a mentor.</li>
                  <li>Choose the lessons each child gets.</li>
                  <li>Build assessments and preview any game.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={cx(styles.wrap, styles.cta)}>
            <h2>Bring Speechomania to your child or centre.</h2>
            <p>Families get an account from their centre. Already have one? Sign in to play.</p>
            <Link className={cx(styles.btn, styles.primary)} to="/login">
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.foot}>
        <div className={styles.wrap}>
          <span>Speechomania</span>
          <span>Made in India</span>
        </div>
      </footer>
    </div>
  )
}

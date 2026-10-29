import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { characterMarkup } from '@/components/child/characters.js'
import { BackIcon, BookIcon, NextIcon, RewardIcon } from '@/components/child/child-icons.jsx'
import { TopBar } from '@/components/child/chrome.jsx'
import { Scene } from '@/components/child/scene.jsx'
import child from '@/components/child/child.module.css'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import styles from './learn-home.module.css'

const PAGE_SIZE = 4

function Book({ lesson, onOpen }) {
  const done = lesson.times_completed > 0
  return (
    <button type="button" className={cx(child.card, styles.book)} onClick={onOpen}>
      <span className={styles.cover} aria-hidden="true">
        {lesson.cover ? lesson.cover.map((id) => <span key={id} dangerouslySetInnerHTML={{ __html: characterMarkup(id) }} />) : <BookIcon size={96} className={styles.coverIcon} />}
      </span>
      <span className={styles.meta}>
        <span className={styles.title}>{lesson.title}</span>
        <span className={cx(styles.status, !done && styles.new)}>{done ? `Read again · best ${lesson.best_stars} stars` : 'New book'}</span>
      </span>
    </button>
  )
}

export function LearnHomeView() {
  const { learner, bar } = useOutletContext()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const shelf = useResource(`/learning/children/${learner.id}/lessons`, { page, page_size: PAGE_SIZE })
  const books = shelf.data?.items ?? []

  return (
    <>
      <Scene />
      <TopBar {...bar} centre={<span className={cx(child.chip, styles.stars)}><RewardIcon size={40} /> {learner.stars} {learner.stars === 1 ? 'star' : 'stars'}</span>} />
      <main className={styles.main}>
        <section className={cx(child.card, styles.hello)}>
          <h1>Hi, {learner.display_name}</h1>
          <p>Pick a book.</p>
        </section>
        {shelf.error ? <p className={cx(child.card, styles.empty)} role="alert">{shelf.error.message}</p> : null}
        {shelf.data && !books.length ? <p className={cx(child.card, styles.empty)}>No books yet. A grown-up will add some soon.</p> : null}
        {books.length ? (
          <ul className={styles.shelf} aria-label="My books">
            {books.map((lesson) => (
              <li key={lesson.id}>
                <Book lesson={lesson} onOpen={() => navigate(`lessons/${lesson.id}`)} />
              </li>
            ))}
          </ul>
        ) : null}
        {shelf.data?.total_pages > 1 ? (
          <nav className={styles.pager} aria-label="More books">
            <button type="button" className={child.pill} onClick={() => setPage((current) => current - 1)} disabled={page === 1}>
              <BackIcon size={26} />
              Back
            </button>
            <button type="button" className={child.pill} onClick={() => setPage((current) => current + 1)} disabled={page >= shelf.data.total_pages}>
              More books
              <NextIcon size={26} />
            </button>
          </nav>
        ) : null}
      </main>
    </>
  )
}

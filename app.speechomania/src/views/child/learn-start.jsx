import { Link, Navigate, useNavigate } from 'react-router'
import { ART, avatarFor } from '@/components/child/art.jsx'
import child from '@/components/child/child.module.css'
import { useResource } from '@/hooks/use-resource.js'
import layout from '@/layout/learning-layout/learning-layout.module.css'
import { cx } from '@/utils/cx'
import styles from './learn-start.module.css'

export function LearnStartView() {
  const navigate = useNavigate()
  const children = useResource('/children', { status: 'active', page: 1, page_size: 12 })
  const list = children.data?.items ?? []

  if (list.length === 1) return <Navigate to={`/learn/${list[0].id}`} replace />

  return (
    <div className={cx(layout.root, styles.root)}>
      <img className={cx(styles.cloud, styles.cloudOne)} src={ART.cloud} alt="" draggable="false" />
      <img className={cx(styles.cloud, styles.cloudTwo)} src={ART.cloud} alt="" draggable="false" />
      <main className={styles.main}>
        {children.data ? (
          list.length ? (
            <>
              <h1>Who is learning today?</h1>
              <ul className={styles.kids}>
                {list.map((kid) => (
                  <li key={kid.id}>
                    <button type="button" className={styles.kid} onClick={() => navigate(`/learn/${kid.id}`)}>
                      <img src={ART[avatarFor(kid.id)]} alt="" draggable="false" />
                      <span>{kid.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={cx(child.card, styles.empty)}>No learners yet. Speechomania will add your child soon.</p>
          )
        ) : (
          <p className={styles.loading} role={children.error ? 'alert' : 'status'}>{children.error ? children.error.message : 'Getting ready…'}</p>
        )}
      </main>
      <Link to="/dashboard" className={cx(child.pill, styles.grownUps)}>Grown-up area</Link>
    </div>
  )
}

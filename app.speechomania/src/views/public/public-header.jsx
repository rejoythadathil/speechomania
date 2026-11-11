import { Link } from 'react-router'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { cx } from '@/utils/cx'
import styles from './landing.module.css'

export function PublicHeader({ nav = true, tryLink = true }) {
  return (
    <header className={styles.top}>
      <div className={styles.wrap}>
        <Link className={styles.brand} to="/">
          <BrandMark size={32} />
          Speechomania
        </Link>
        {nav ? (
          <nav className={styles.nav} aria-label="Main">
            <a href="/#games">Games</a>
            <a href="/#how">How it works</a>
            <a href="/#who">Who it is for</a>
          </nav>
        ) : null}
        <div className={styles.acts}>
          <Link
            className={cx(styles.btn, styles.ghost, styles.small, tryLink && styles.signIn)}
            to="/login"
          >
            Sign in
          </Link>
          {tryLink ? (
            <Link className={cx(styles.btn, styles.primary, styles.small)} to="/try">
              Try for free
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

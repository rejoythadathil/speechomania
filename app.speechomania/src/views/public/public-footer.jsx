import { Link } from 'react-router'
import styles from './landing.module.css'

export function PublicFooter() {
  return (
    <footer className={styles.foot}>
      <div className={styles.wrap}>
        <span>Speechomania, a product of Autism Synergies</span>
        <nav className={styles.footLinks} aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <span>Made in India</span>
        </nav>
      </div>
    </footer>
  )
}

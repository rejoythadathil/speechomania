import { cx } from '@/utils/cx'
import { BreakIcon, GrownUpIcon, MuteIcon, SayAgainIcon } from './child-icons.jsx'
import styles from './child.module.css'

export function TopBar({ centre, onGrownUp, onBreak, muted, onMute }) {
  return (
    <header className={cx(styles.chrome, styles.top)}>
      <button type="button" className={styles.pill} onClick={onGrownUp}>
        <GrownUpIcon size={34} />
        <span className={styles.label}>Parent</span>
      </button>
      <div className={styles.spacer} />
      {centre ? <div className={styles.centre}>{centre}</div> : null}
      <div className={styles.spacer} />
      <button
        type="button"
        className={styles.round}
        onClick={onMute}
        aria-pressed={muted}
        aria-label={muted ? 'Sound is off' : 'Sound is on'}
      >
        {muted ? <MuteIcon size={34} /> : <SayAgainIcon size={34} />}
      </button>
      <button type="button" className={styles.pill} onClick={onBreak}>
        <BreakIcon size={30} />
        <span className={styles.label}>Break</span>
      </button>
    </header>
  )
}

export function BottomBar({ onSayAgain, next }) {
  return (
    <footer className={cx(styles.chrome, styles.bottom)}>
      {onSayAgain ? (
        <button type="button" className={styles.pill} onClick={onSayAgain}>
          <SayAgainIcon size={34} />
          <span className={styles.label}>Say it again</span>
        </button>
      ) : (
        <span />
      )}
      {next}
    </footer>
  )
}

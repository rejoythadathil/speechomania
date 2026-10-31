import { cx } from '@/utils/cx'
import { BreakIcon, DoneIcon, GrownUpIcon, MuteIcon, SayAgainIcon } from './child-icons.jsx'
import styles from './child.module.css'

export function TopBar({ centre, onGrownUp, onBreak, muted, onMute }) {
  return (
    <header className={cx(styles.chrome, styles.top)}>
      <button type="button" className={styles.pill} onClick={onGrownUp}>
        <GrownUpIcon size={34} />
        <span className={styles.label}>Grown-ups</span>
      </button>
      <div className={styles.spacer} />
      {centre ? <div className={styles.centre}>{centre}</div> : null}
      <div className={styles.spacer} />
      <button type="button" className={styles.round} onClick={onMute} aria-pressed={muted} aria-label={muted ? 'Sound is off' : 'Sound is on'}>
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
      ) : <span />}
      {next}
    </footer>
  )
}

export function Steps({ steps, current, count }) {
  return (
    <ol className={styles.steps} aria-label="Lesson steps">
      {steps.map((label, index) => (
        <li key={label} className={cx(styles.step, index === current && styles.stepNow, index < current && styles.stepDone)} aria-current={index === current ? 'step' : undefined}>
          <span className={styles.stepNumber}>{index < current ? <DoneIcon size={16} strokeWidth={3} /> : index + 1}</span>
          <span className={styles.label}>{label}</span>
        </li>
      ))}
      {count ? <li className={styles.count}>{count}</li> : null}
    </ol>
  )
}

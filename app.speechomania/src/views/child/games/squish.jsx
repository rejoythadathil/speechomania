import { ART } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'
import { Picture, WordChoices } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

export function SquishGame(props) {
  const { step } = props
  const round = useRound(props)
  const squished = round.phase === 'right'
  const mark = step.answer.search(/[’']/)
  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <Picture step={step} className={styles.small} />
        <div className={cx(styles.press, squished && styles.squished)}>
          <img className={styles.clamp} src={ART.clamp} alt="" draggable="false" />
          <span className={styles.block}>{step.first}</span>
          <span className={cx(styles.block, styles.blockTwo)}>{step.second}</span>
          <span className={styles.merged} aria-hidden={!squished}>
            {step.answer.slice(0, mark)}
            <b>{step.answer.slice(mark, mark + 1)}</b>
            {step.answer.slice(mark + 1)}
          </span>
        </div>
        <WordChoices choices={step.choices} answer={step.answer} round={round} />
      </div>
    </div>
  )
}

import { ART } from '@/components/child/art.jsx'
import { Picture, WordChoices } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

export function WhyGame(props) {
  const { step } = props
  const round = useRound(props)
  return (
    <div className={styles.stage}>
      <img className={styles.detective} src={ART.detective} alt="" draggable="false" />
      <div className={styles.column}>
        <span className={styles.lens}>
          <Picture step={step} className={styles.spot} />
          <img className={styles.magnifier} src={ART.magnifier} alt="" draggable="false" />
        </span>
        <WordChoices choices={step.choices} answer={step.answer} round={round} className={styles.reasons} />
      </div>
    </div>
  )
}

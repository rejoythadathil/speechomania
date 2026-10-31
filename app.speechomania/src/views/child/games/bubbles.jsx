import { Picture, WordChoices } from './parts.jsx'
import { useRound } from './use-round.js'
import styles from './games.module.css'

export function BubblesGame(props) {
  const { step } = props
  const round = useRound(props)
  return (
    <div className={styles.stage}>
      <div className={styles.column}>
        <Picture step={step} />
        <WordChoices choices={step.choices} answer={step.answer} round={round} className={styles.bubbleChoices} />
      </div>
    </div>
  )
}

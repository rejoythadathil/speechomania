import { cx } from '@/utils/cx'
import styles from './child.module.css'

export function ReadAlong({ text, wordIndex, contrast, id }) {
  const negative = contrast?.toLowerCase()
  return (
    <p className={styles.say} id={id}>
      {text.split(' ').map((word, index) => {
        const bare = word.replace(/[^\p{L}’']/gu, '').toLowerCase()
        const tone = negative && bare === negative ? styles.neg : negative && bare === 'can' ? styles.pos : null
        return (
          <span key={`${index}-${word}`}>
            {index ? ' ' : null}
            <span className={cx(styles.word, tone, index === wordIndex && styles.wordOn)}>{word}</span>
          </span>
        )
      })}
    </p>
  )
}

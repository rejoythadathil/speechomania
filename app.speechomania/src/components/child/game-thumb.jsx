import { ART, GAME_ART } from './art.jsx'
import { sceneFor } from './scenes.js'
import styles from './child.module.css'

export function GameThumb({ player, cover }) {
  const scene = sceneFor(player)
  const art = player === 'pick' && cover ? cover : GAME_ART[player] ?? GAME_ART.story
  return (
    <span className={styles.thumb} style={{ background: scene.background }} aria-hidden="true">
      {scene.decor.slice(0, 4).map(([name, left, top, size], index) => (
        <img key={`${name}-${index}`} className={styles.thumbDecor} src={ART[name]} alt="" draggable="false" style={{ left: `${left}%`, top: `${Math.min(top, 82)}%`, width: `${Math.round(size / 4.5)}%` }} />
      ))}
      <span className={styles.thumbHero}>
        <img src={ART[art[0]]} alt="" draggable="false" />
        {art[1] ? <img className={styles.thumbBuddy} src={ART[art[1]]} alt="" draggable="false" /> : null}
      </span>
    </span>
  )
}

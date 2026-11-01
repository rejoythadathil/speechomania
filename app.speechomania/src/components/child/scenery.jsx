import { ART } from './art.jsx'
import { sceneFor } from './scenes.js'
import styles from './child.module.css'

export function Scenery({ player }) {
  return (
    <div className={styles.scenery} aria-hidden="true">
      {sceneFor(player).decor.map(([name, left, top, size, motion = 'bob'], index) => (
        <img
          key={`${name}-${index}`}
          className={styles[motion]}
          src={ART[name]}
          alt=""
          draggable="false"
          style={{ left: `${left}%`, top: `${top}%`, width: `clamp(${Math.round(size * 0.55)}px, ${(size / 12).toFixed(1)}vw, ${size}px)`, animationDelay: `-${index * 1.3}s` }}
        />
      ))}
    </div>
  )
}

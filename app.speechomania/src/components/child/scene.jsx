import { cx } from '@/utils/cx'
import styles from './child.module.css'

export function Scene({ morning = false, children }) {
  return (
    <div className={cx(styles.world, morning && styles.morning)}>
      <svg className={styles.scene} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="child-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={morning ? '#ffe9c7' : '#cfe6f7'} />
            <stop offset="0.75" stopColor="#f1f8fd" />
          </linearGradient>
          <linearGradient id="child-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b4dbbf" />
            <stop offset="1" stopColor="#9fcdac" />
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#child-sky)" />
        <circle className={styles.sun} cx="1330" cy="230" r="70" fill="#ffeab0" />
        <g className={styles.cloud} fill="#ffffff" opacity="0.95">
          <ellipse cx="300" cy="190" rx="92" ry="34" />
          <ellipse cx="350" cy="168" rx="58" ry="40" />
          <ellipse cx="262" cy="176" rx="44" ry="30" />
        </g>
        <g className={styles.cloud} fill="#ffffff" opacity="0.8">
          <ellipse cx="960" cy="140" rx="70" ry="24" />
          <ellipse cx="996" cy="124" rx="42" ry="28" />
        </g>
        <path d="M0 640 C 180 560 360 560 560 610 C 760 660 900 560 1120 560 C 1320 560 1460 620 1600 600 L1600 1000 L0 1000Z" fill="#d7ebdf" />
        <path d="M0 720 C 260 650 520 680 760 700 C 1000 720 1240 640 1600 690 L1600 1000 L0 1000Z" fill="#c4e2cd" />
        <g transform="translate(40 500)">
          <rect x="62" y="150" width="34" height="230" rx="14" fill="#c9a27e" />
          <circle cx="80" cy="110" r="96" fill="#a9d3b2" />
          <circle cx="10" cy="160" r="70" fill="#a3cfad" />
          <circle cx="152" cy="168" r="66" fill="#a3cfad" />
        </g>
        <g transform="translate(1440 600)">
          <rect x="40" y="90" width="22" height="130" rx="10" fill="#c9a27e" />
          <circle cx="51" cy="70" r="62" fill="#acd4b5" />
        </g>
        <path d="M0 790 C 300 770 620 805 900 798 C 1180 791 1400 770 1600 782 L1600 1000 L0 1000Z" fill="url(#child-grass)" />
      </svg>
      <div className={styles.cast}>{children}</div>
    </div>
  )
}

const ink = { stroke: '#2a3b4c', strokeWidth: 6, strokeLinejoin: 'round' }

export function Tree({ left }) {
  return (
    <div className={styles.prop} style={{ left: `${left}%`, width: 'clamp(220px, 26vw, 340px)', height: '70%' }}>
      <svg viewBox="0 0 300 640" width="100%" height="100%" overflow="visible" aria-hidden="true" focusable="false">
        <path d="M128 640 L134 170 Q150 150 166 170 L172 640Z" fill="#b98b62" {...ink} />
        <path d="M150 260 Q190 230 214 206" fill="none" stroke="#2a3b4c" strokeWidth="22" strokeLinecap="round" />
        <path d="M150 260 Q190 230 214 206" fill="none" stroke="#b98b62" strokeWidth="12" strokeLinecap="round" />
        <g {...ink}>
          <circle cx="150" cy="120" r="100" fill="#8cc79b" />
          <circle cx="66" cy="170" r="66" fill="#86c194" />
          <circle cx="236" cy="168" r="64" fill="#86c194" />
        </g>
        <circle cx="120" cy="96" r="34" fill="#a3d6b0" />
      </svg>
    </div>
  )
}

export function School({ left }) {
  return (
    <div className={styles.prop} style={{ left: `${left}%`, width: 'clamp(160px, 20vw, 280px)', height: '34%' }}>
      <svg viewBox="0 0 400 340" width="100%" height="100%" aria-hidden="true" focusable="false">
        <g {...ink}>
          <path d="M40 140 L200 40 L360 140Z" fill="#e2674f" />
          <rect x="60" y="140" width="280" height="196" fill="#f6e4c8" />
          <rect x="170" y="230" width="60" height="106" rx="8" fill="#5c8fbf" />
          <rect x="88" y="170" width="54" height="46" rx="6" fill="#cfe6f7" />
          <rect x="258" y="170" width="54" height="46" rx="6" fill="#cfe6f7" />
          <circle cx="200" cy="104" r="20" fill="#fff" />
        </g>
        <path d="M200 104 v-10 M200 104 h8" stroke="#2a3b4c" strokeWidth="4" strokeLinecap="round" />
        <path d="M200 40 V6 L236 16 L200 26" fill="#f2b93b" stroke="#2a3b4c" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Water() {
  return (
    <span className={styles.water}>
      <svg viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 30 Q25 14 50 30 T100 30 T150 30 T200 30 T250 30 T300 30 T350 30 T400 30 V118 Q400 136 382 136 H18 Q0 136 0 118Z" fill="#7cc3ea" stroke="#2a3b4c" strokeWidth="5" strokeLinejoin="round" />
        <path d="M40 70 q20 -10 40 0 M210 92 q20 -10 40 0 M300 60 q20 -10 40 0" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      </svg>
    </span>
  )
}

export function Notes() {
  return (
    <span className={styles.notes}>
      <svg viewBox="0 0 120 120" width="100%" height="100%" overflow="visible" aria-hidden="true" focusable="false">
        <path d="M36 86 V28 l32 -8 V76" fill="none" stroke="#2a3b4c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 86 m-14 0 a14 10 -20 1 0 28 0 a14 10 -20 1 0 -28 0 M68 76 m-14 0 a14 10 -20 1 0 28 0 a14 10 -20 1 0 -28 0" fill="#2a3b4c" />
        <path d="M98 58 V16 q10 6 16 18" fill="none" stroke="#2a3b4c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 58 m-13 0 a13 9 -20 1 0 26 0 a13 9 -20 1 0 -26 0" fill="#2a3b4c" />
      </svg>
    </span>
  )
}

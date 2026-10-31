import confetti from 'canvas-confetti'
import { useMemo } from 'react'
import ding from '@/assets/sounds/ding.m4a'
import soft from '@/assets/sounds/soft.m4a'
import win from '@/assets/sounds/win.m4a'

const SOUNDS = { ding, soft, win }
const VOLUME = { normal: 1, quiet: 0.5 }

function originOf(element) {
  if (!element) return { x: 0.5, y: 0.5 }
  const box = element.getBoundingClientRect()
  return { x: (box.left + box.width / 2) / window.innerWidth, y: (box.top + box.height / 2) / window.innerHeight }
}

export function useCelebrate({ motion, sound, muted }) {
  return useMemo(() => {
    const play = (name, level = 1) => {
      if (muted || sound === 'off') return
      const audio = new Audio(SOUNDS[name])
      audio.volume = (VOLUME[sound] ?? 1) * level
      audio.play().catch(() => null)
    }
    const burst = (options) => {
      if (motion === 'off') return
      confetti({ disableForReducedMotion: true, particleCount: motion === 'gentle' ? 40 : 90, ...options })
    }
    return {
      cheer(element) {
        play('ding')
        burst({ spread: 75, startVelocity: 32, origin: originOf(element) })
      },
      nudge() {
        play('soft', 0.4)
      },
      finale(element) {
        play('win')
        burst({ particleCount: motion === 'gentle' ? 60 : 160, spread: 110, startVelocity: 45, origin: originOf(element) })
        if (motion !== 'full') return
        setTimeout(() => burst({ angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 300)
        setTimeout(() => burst({ angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 500)
      },
      reset: () => confetti.reset()
    }
  }, [motion, sound, muted])
}

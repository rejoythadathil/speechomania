import confetti from 'canvas-confetti'
import { useMemo } from 'react'
import ding from '@/assets/sounds/ding.m4a'
import soft from '@/assets/sounds/soft.m4a'
import win from '@/assets/sounds/win.m4a'

const SOUNDS = { ding, soft, win }
const fire = confetti.create(null, { resize: true, useWorker: false })
const VOLUME = { normal: 1, quiet: 0.5 }

function originOf(element) {
  if (!element) return { x: 0.5, y: 0.5 }
  const box = element.getBoundingClientRect()
  return {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight
  }
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
      fire({
        disableForReducedMotion: true,
        particleCount: motion === 'gentle' ? 40 : 90,
        ...options
      })
    }
    return {
      motion,
      cheer(element) {
        play('ding')
        burst({ spread: 75, startVelocity: 32, origin: originOf(element) })
      },
      streak(element) {
        play('ding')
        play('win', 0.35)
        burst({
          shapes: ['star'],
          colors: ['#f5b301', '#ffd84d', '#ffe9a3'],
          particleCount: motion === 'gentle' ? 30 : 70,
          scalar: 1.4,
          spread: 100,
          startVelocity: 30,
          origin: originOf(element)
        })
      },
      nudge() {
        play('soft', 0.4)
      },
      finale(element, big = true) {
        play('win', big ? 1 : 0.6)
        burst({
          particleCount: (motion === 'gentle' ? 60 : 160) / (big ? 1 : 2),
          shapes: ['star', 'circle', 'square'],
          scalar: 1.2,
          spread: 110,
          startVelocity: 45,
          origin: originOf(element)
        })
        if (motion !== 'full' || !big) return
        setTimeout(() => burst({ angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 300)
        setTimeout(() => burst({ angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 500)
      },
      reset: () => fire.reset()
    }
  }, [motion, sound, muted])
}

import { Avatar, Style } from '@dicebear/core'
import definition from '@dicebear/styles/gaze.json'
import { useMemo } from 'react'
import { cx } from '@/utils/cx'

const gaze = new Style(definition)
const cache = new Map()

export function avatarUrl(seed) {
  if (!cache.has(seed)) {
    const svg = new Avatar(gaze, { seed }).toString()
    cache.set(seed, `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  }
  return cache.get(seed)
}

export function UserAvatar({ seed, name, size = 32, className }) {
  const src = useMemo(() => avatarUrl(seed), [seed])
  return (
    <img
      src={src}
      alt={name ? `${name}'s avatar` : ''}
      width={size}
      height={size}
      className={cx('shrink-0 rounded-full bg-[#eef0f3] object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}

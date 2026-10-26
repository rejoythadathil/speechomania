import { useCallback, useRef, useState } from 'react'

export function useChartTooltip() {
  const containerRef = useRef(null)
  const [tip, setTip] = useState(null)

  const show = useCallback((target, rows) => {
    const box = containerRef.current?.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    if (!box) return
    setTip({ x: rect.left - box.left + rect.width / 2, y: rect.top - box.top, rows })
  }, [])

  const showAt = useCallback((x, y, rows) => setTip({ x, y, rows }), [])
  const hide = useCallback(() => setTip(null), [])

  return { containerRef, tip, show, showAt, hide }
}

export function ChartTooltip({ tip }) {
  if (!tip) return null
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 whitespace-nowrap shadow-[0_6px_16px_-8px_rgb(22_22_62/0.25)]"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      {tip.rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          {row.color ? <span className="h-0.5 w-3 rounded-full" style={{ background: row.color }} aria-hidden /> : null}
          <span className="text-body-2-semibold text-text-primary">{row.value}</span>
          <span className="text-caption-1-medium text-text-tertiary">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

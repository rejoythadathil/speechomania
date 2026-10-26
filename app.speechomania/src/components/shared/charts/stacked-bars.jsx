import { ChartTooltip, useChartTooltip } from './chart-tooltip.jsx'
import { Legend } from './legend.jsx'

export function StackedBars({ rows, series, unit, ariaLabel }) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const totals = rows.map((row) => series.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0))
  const max = Math.max(...totals, 1)
  return (
    <figure ref={containerRef} className="relative m-0 flex flex-col gap-3" aria-label={ariaLabel}>
      <Legend series={series} />
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {rows.map((row, index) => (
          <li key={row.key}>
            <button
              type="button"
              className="flex w-full cursor-default flex-col gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              aria-label={`${row.label}: ${totals[index]} ${unit}, ${series.map((item) => `${row.values[item.key] ?? 0} ${item.label}`).join(', ')}`}
              onPointerEnter={(event) => show(event.currentTarget, series.map((item) => ({ value: row.values[item.key] ?? 0, label: item.label, color: item.color })))}
              onPointerLeave={hide}
              onFocus={(event) => show(event.currentTarget, series.map((item) => ({ value: row.values[item.key] ?? 0, label: item.label, color: item.color })))}
              onBlur={hide}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-body-2-medium text-text-primary">{row.label}</span>
                <span className="text-body-2-semibold text-text-primary">{totals[index]}</span>
              </span>
              <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--viz-grid)]" aria-hidden>
                {series.map((item) => (row.values[item.key] ? (
                  <span key={item.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(row.values[item.key] / max) * 100}%`, background: item.color }} />
                ) : null))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ChartTooltip tip={tip} />
    </figure>
  )
}

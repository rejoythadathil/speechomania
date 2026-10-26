import { ChartTooltip, useChartTooltip } from './chart-tooltip.jsx'
import { Legend } from './legend.jsx'
import { niceMax } from './scale.js'

const total = (point, series) => series.reduce((sum, item) => sum + (point.values[item.key] ?? 0), 0)

export function ColumnChart({ data, series, unit, height = 196, ariaLabel }) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const max = niceMax(Math.max(...data.map((point) => total(point, series)), 0))
  const ticks = [max, max / 2, 0]
  const lastIndex = data.length - 1
  const rows = (point) => [
    { value: total(point, series), label: `${unit} · ${point.detail ?? point.label}` },
    ...(series.length > 1 ? series.map((item) => ({ value: point.values[item.key] ?? 0, label: item.label, color: item.color })) : [])
  ]

  return (
    <figure ref={containerRef} className="relative m-0 flex flex-col gap-3" aria-label={ariaLabel}>
      {series.length > 1 ? <Legend series={series} /> : null}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between pb-6 text-right text-caption-1-medium text-text-tertiary" style={{ height }} aria-hidden>
          {ticks.map((tick) => <span key={tick} className="leading-none">{tick}</span>)}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }} aria-hidden>
            {ticks.map((tick) => <span key={tick} className="h-px bg-[var(--viz-grid)]" />)}
          </div>
          <div className="flex flex-1 items-end justify-between gap-1.5" style={{ height: height - 24 }}>
            {data.map((point, index) => {
              const sum = total(point, series)
              const visible = series.filter((item) => point.values[item.key])
              return (
                <button
                  key={point.key}
                  type="button"
                  className="group relative flex h-full flex-1 cursor-default flex-col-reverse items-center outline-none"
                  aria-label={`${point.detail ?? point.label}: ${sum} ${unit}${series.length > 1 ? `, ${series.map((item) => `${point.values[item.key] ?? 0} ${item.label}`).join(', ')}` : ''}`}
                  onPointerEnter={(event) => show(event.currentTarget.querySelector('[data-top]') ?? event.currentTarget, rows(point))}
                  onPointerLeave={hide}
                  onFocus={(event) => show(event.currentTarget.querySelector('[data-top]') ?? event.currentTarget, rows(point))}
                  onBlur={hide}
                >
                  <span className="flex w-full max-w-6 flex-col-reverse rounded-t-[4px] transition-[filter] duration-150 group-hover:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-border-focus-ring" style={{ height: `${(sum / max) * 100}%` }}>
                    {visible.map((item, segment) => (
                      <span
                        key={item.key}
                        data-top={segment === visible.length - 1 ? '' : undefined}
                        className={segment === visible.length - 1 ? 'rounded-t-[4px]' : 'border-t-2 border-[var(--surface)]'}
                        style={{ height: `${(point.values[item.key] / sum) * 100}%`, background: item.color, minHeight: 3, order: segment }}
                      />
                    ))}
                  </span>
                  {index === lastIndex ? (
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 pb-1 text-caption-1-semibold text-text-primary" style={{ bottom: `${(sum / max) * 100}%` }} aria-hidden>
                      {sum}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between gap-1.5 pt-2" aria-hidden>
            {data.map((point, index) => <span key={point.key} className="flex-1 text-center text-caption-1-medium whitespace-nowrap text-text-tertiary">{data.length <= 8 || (lastIndex - index) % 2 === 0 ? point.label : ''}</span>)}
          </div>
        </div>
      </div>
      <ChartTooltip tip={tip} />
    </figure>
  )
}

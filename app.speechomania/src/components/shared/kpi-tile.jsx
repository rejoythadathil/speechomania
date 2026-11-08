import { RiCheckboxCircleFill, RiErrorWarningFill, RiTimeFill } from '@remixicon/react'
import { Link } from 'react-router'
import { cx } from '@/utils/cx'

const TONES = {
  danger: { color: 'var(--viz-danger)', soft: 'var(--viz-danger-soft)', icon: RiErrorWarningFill },
  warn: { color: 'var(--viz-warn)', soft: 'var(--viz-warn-soft)', icon: RiTimeFill },
  info: { color: 'var(--viz-info)', soft: 'var(--viz-info-soft)', icon: RiTimeFill },
  good: { color: 'var(--viz-good)', soft: 'var(--viz-good-soft)', icon: RiCheckboxCircleFill }
}

function Pill({ tone, children }) {
  const { color, soft, icon: Icon } = TONES[tone]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-1-semibold whitespace-nowrap"
      style={{ color, background: soft }}
    >
      <Icon className="size-3.5" aria-hidden />
      {children}
    </span>
  )
}

export function KpiTile({ label, icon: Icon, value, note, tone, status, to }) {
  const active = tone && value > 0
  const chip = active ? TONES[tone] : tone ? TONES.good : null
  const body = (
    <>
      <span className="flex items-center gap-2 text-body-2-medium text-text-secondary">
        {Icon ? (
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--viz-grid)] text-text-tertiary"
            style={chip ? { color: chip.color, background: chip.soft } : undefined}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        {label}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[1.75rem] leading-9 font-semibold tracking-tight text-text-primary">
          {value}
        </span>
        {active ? <Pill tone={tone}>{status}</Pill> : null}
        {tone && !active ? <Pill tone="good">All clear</Pill> : null}
      </span>
      {note ? <span className="text-caption-1-medium text-text-tertiary">{note}</span> : null}
    </>
  )
  const className = 'flex min-w-0 flex-col gap-1 bg-[var(--surface)] px-4 py-3.5'
  if (to) {
    return (
      <Link
        to={to}
        className={cx(
          className,
          'outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring'
        )}
      >
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}

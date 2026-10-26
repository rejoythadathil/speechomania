import { RiErrorWarningFill } from '@remixicon/react'
import { Link } from 'react-router'
import { cx } from '@/utils/cx'

export function KpiTile({ label, icon: Icon, value, note, attention, to }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-body-2-medium text-text-secondary">
        {Icon ? <Icon className="size-4 text-text-tertiary" aria-hidden /> : null}
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-[1.75rem] leading-9 font-semibold tracking-tight text-text-primary">{value}</span>
        {attention && value > 0 ? <RiErrorWarningFill className="size-4 text-[var(--viz-warn)]" aria-label="Needs attention" /> : null}
      </span>
      {note ? <span className="text-caption-1-medium text-text-tertiary">{note}</span> : null}
    </>
  )
  const className = 'flex min-w-0 flex-col gap-1 bg-[var(--surface)] px-4 py-3.5'
  if (to) {
    return <Link to={to} className={cx(className, 'outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring')}>{body}</Link>
  }
  return <div className={className}>{body}</div>
}

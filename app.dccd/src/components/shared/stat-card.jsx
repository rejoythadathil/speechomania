import { Link } from 'react-router'
import { cx } from '@/utils/cx'

const TONES = {
  blue: 'text-accent-600',
  coral: 'text-brand-coral',
  teal: 'text-brand-teal',
  neutral: 'text-text-tertiary'
}

export function StatStrip({ children, className }) {
  return (
    <div style={{ background: 'var(--line)' }} className={cx('surface grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4 xl:grid-cols-7 [&>*:last-child]:col-span-2 xl:[&>*:last-child]:col-span-1', className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'blue', to }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-caption-1-medium text-text-tertiary">
        {Icon ? <Icon className={cx('size-3.5 shrink-0', TONES[tone])} aria-hidden /> : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-title-2-semibold leading-tight tabular-nums text-text-primary">{value ?? '—'}</span>
        {hint ? <span className="truncate text-caption-1-medium text-text-tertiary">{hint}</span> : null}
      </span>
    </>
  )
  const className = 'flex min-w-0 flex-col gap-1 bg-[var(--surface)] px-3.5 py-2.5'
  if (to) {
    return (
      <Link to={to} className={cx(className, 'outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring')}>
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}

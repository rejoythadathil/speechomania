import { cx } from '@/utils/cx'

export function Panel({ title, description, actions, toolbar, footer, children, className, bodyClassName }) {
  return (
    <section className={cx('surface flex flex-col overflow-hidden', className)}>
      {title ? (
        <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-2">
          <div className="flex min-w-0 flex-col">
            <h2 className="text-body-medium font-semibold text-text-primary">{title}</h2>
            {description ? <p className="text-caption-1-medium text-text-tertiary">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      {toolbar ? <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-2">{toolbar}</div> : null}
      <div className={cx('p-3', bodyClassName)}>{children}</div>
      {footer ? <div className="flex items-center justify-end border-t border-[var(--line)] px-3 py-2 empty:hidden">{footer}</div> : null}
    </section>
  )
}

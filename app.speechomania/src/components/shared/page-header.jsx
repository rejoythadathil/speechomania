export function PageHeader({ eyebrow, title, description, actions, large }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col">
        {eyebrow ? <span className="text-caption-1-semibold tracking-wide text-text-tertiary uppercase">{eyebrow}</span> : null}
        <h1 className={large ? 'font-display text-[2rem] leading-10 font-semibold tracking-tight text-text-primary' : 'font-display text-title-2-semibold text-text-primary'}>{title}</h1>
        {description ? <p className={large ? 'max-w-2xl text-body-regular text-text-secondary' : 'max-w-2xl text-body-2-regular text-text-tertiary'}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
    </header>
  )
}

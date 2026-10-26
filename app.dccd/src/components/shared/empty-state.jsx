export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      {Icon ? (
        <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-accent-50 text-accent-700">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <div className="flex max-w-sm flex-col gap-0.5">
        <h3 className="text-body-medium text-text-primary">{title}</h3>
        {description ? <p className="text-body-2-regular text-text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

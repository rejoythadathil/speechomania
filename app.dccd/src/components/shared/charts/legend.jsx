export function Legend({ series }) {
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-caption-1-medium text-text-secondary">
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function BrandMark({ size = 32, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Speechomania">
      <path d="M20 6h24c8.8 0 16 7.2 16 16v10c0 8.8-7.2 16-16 16H34L20 60V48.6C13.4 46.6 8 40.4 8 32V22C8 13.2 11.2 6 20 6Z" fill="var(--color-brand-blue)" />
      <rect x="19" y="24" width="6" height="16" rx="3" fill="#fff" />
      <rect x="29" y="17" width="6" height="30" rx="3" fill="#fff" />
      <rect x="39" y="21" width="6" height="22" rx="3" fill="#fff" />
    </svg>
  )
}

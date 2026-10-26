export function BrandMark({ size = 32, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="DCCD">
      <circle cx="19" cy="43" r="13" fill="var(--color-brand-coral)" />
      <rect x="31" y="5" width="15" height="54" rx="7.5" fill="var(--color-brand-blue)" transform="rotate(16 38.5 32)" />
    </svg>
  )
}

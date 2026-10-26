import { RiErrorWarningLine } from '@remixicon/react'

export function FormAlert({ error }) {
  if (!error) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-2xl bg-brand-coral-soft px-3 py-2.5 text-body-2-medium text-brand-navy">
      <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-brand-coral" aria-hidden />
      <span>{error.message}</span>
    </div>
  )
}

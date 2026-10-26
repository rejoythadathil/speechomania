import { RiErrorWarningLine } from '@remixicon/react'
import { Button } from '@/components/base/buttons/button'

export function DataState({ loading, error, onRetry, children }) {
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <RiErrorWarningLine className="size-6 text-text-error-primary" aria-hidden />
        <p className="text-body-regular text-text-secondary">{error.message}</p>
        {onRetry ? <Button variant="secondary" size="small" onClick={onRetry}>Try again</Button> : null}
      </div>
    )
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-2" aria-busy="true" aria-label="Loading">
        {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded-xl bg-background-tertiary-default motion-reduce:animate-none" />)}
      </div>
    )
  }
  return children
}

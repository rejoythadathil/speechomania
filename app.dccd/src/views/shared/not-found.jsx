import { RiCompass3Line } from '@remixicon/react'
import { RouterButton } from '@/components/shared/router-button.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'

export function NotFoundView() {
  return (
    <EmptyState
      icon={RiCompass3Line}
      title="This page isn’t available"
      description="It may have moved, or your account may not have access to it."
      action={<RouterButton to="/dashboard" variant="secondary">Back to dashboard</RouterButton>}
    />
  )
}

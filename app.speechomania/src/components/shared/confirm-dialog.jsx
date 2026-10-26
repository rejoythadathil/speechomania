import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { FormAlert } from './form-alert.jsx'
import { Modal } from './modal.jsx'

export function ConfirmDialog({ isOpen, onOpenChange, title, message, confirmLabel, onConfirm, tone = 'danger' }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function confirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      footer={(
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} disabled={pending}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </>
      )}
    >
      <p className="text-body-regular text-text-secondary">{message}</p>
      <FormAlert error={error} />
    </Modal>
  )
}

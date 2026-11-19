import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Textarea } from '@/components/base/textarea/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDate } from '@/utils/format'

function DeletionRequest({ request, onChange }) {
  const notify = useToast()
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(null)

  if (request?.status === 'pending') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body-regular text-text-primary">
          You asked us to erase your account on {formatDate(request.requested_at)}. Our team will
          check the request and erase everything, or tell you here why it cannot yet. You can keep
          using Speechomania until then.
        </p>
        <span>
          <Button variant="secondary" onClick={() => setConfirm('cancel')}>
            Cancel my request
          </Button>
        </span>
        <ConfirmDialog
          isOpen={confirm === 'cancel'}
          onOpenChange={() => setConfirm(null)}
          title="Cancel your request?"
          message="Your account and your children’s progress stay as they are."
          confirmLabel="Cancel request"
          tone="primary"
          onConfirm={async () => {
            await api('/account/deletion', { method: 'DELETE' })
            onChange()
            notify('Request cancelled')
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {request?.status === 'declined' ? (
        <p className="rounded-2xl bg-background-secondary-default p-3 text-body-regular text-text-primary">
          We could not erase your account yet: {request.note}
        </p>
      ) : null}
      <p className="text-body-regular text-text-secondary">
        We will delete your children, all their game results and mentor notes, and your name, email
        and phone number. You will no longer be able to sign in. This cannot be undone once our team
        has erased it.
      </p>
      <Textarea
        label="Why are you leaving?"
        hint="Optional"
        value={reason}
        onChange={setReason}
        rows={2}
        maxLength={500}
      />
      <span>
        <Button variant="danger" onClick={() => setConfirm('request')}>
          Ask to erase my account
        </Button>
      </span>
      <ConfirmDialog
        isOpen={confirm === 'request'}
        onOpenChange={() => setConfirm(null)}
        title="Erase your account and your children’s data?"
        message="Our team will check your request and then erase everything for good. You can cancel until they do."
        confirmLabel="Send request"
        onConfirm={async () => {
          await api('/account/deletion', { method: 'POST', body: { reason } })
          onChange()
          notify('Request sent')
        }}
      />
    </div>
  )
}

export function AccountView() {
  const { user } = useAuth()
  const deletion = useResource('/account/deletion')

  return (
    <>
      <PageHeader title="Account" description="Your sign-in, your privacy and your data." />
      <div className="flex flex-col gap-4">
        <Panel title="Signed in as">
          <div className="flex flex-col gap-1">
            <span className="text-body-medium text-text-primary">{user.full_name}</span>
            <span className="text-body-2-regular text-text-secondary">{user.email}</span>
          </div>
        </Panel>
        <Panel title="Privacy">
          <p className="text-body-regular text-text-secondary">
            Read how we look after your family’s information in our{' '}
            <Link className="text-text-brand underline" to="/privacy">
              privacy policy
            </Link>{' '}
            and{' '}
            <Link className="text-text-brand underline" to="/terms">
              terms of use
            </Link>
            .
          </p>
        </Panel>
        <Panel title="Erase my account">
          <DataState
            loading={deletion.loading && !deletion.data}
            error={deletion.error}
            onRetry={deletion.reload}
          >
            {deletion.data ? (
              <DeletionRequest request={deletion.data.request} onChange={deletion.reload} />
            ) : null}
          </DataState>
        </Panel>
      </div>
    </>
  )
}

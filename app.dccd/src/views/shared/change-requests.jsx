import { RiEditBoxLine } from '@remixicon/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Tab, TabList, Tabs } from '@/components/base/tabs/tabs'
import { Textarea } from '@/components/base/textarea/textarea'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { RouterButton } from '@/components/shared/router-button.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDateTime } from '@/utils/format'

function ReviewModal({ request, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  async function decide(decision) {
    setPending(decision)
    setError(null)
    try {
      onDone(await api(`/change-requests/${request.id}/review`, { method: 'POST', body: { decision, review_note: note } }), decision)
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(null)
    }
  }

  return (
    <Modal
      isOpen
      onOpenChange={onClose}
      title="Review change request"
      description={`${request.lesson_title} · v${request.lesson_version}, from ${request.requested_by_name}`}
      footer={(
        <>
          <Button variant="secondary" onClick={() => decide('reject')} disabled={Boolean(pending)}>{pending === 'reject' ? 'Rejecting…' : 'Reject'}</Button>
          <Button onClick={() => decide('approve')} disabled={Boolean(pending)}>{pending === 'approve' ? 'Approving…' : 'Approve and open draft'}</Button>
        </>
      )}
    >
      <FormAlert error={error} />
      <div className="flex flex-col gap-1 rounded-2xl bg-background-secondary-default p-3">
        <span className="text-caption-1-semibold text-text-tertiary uppercase">Proposed change</span>
        <p className="text-body-regular text-text-primary">{request.proposed_change.summary}</p>
        <span className="mt-2 text-caption-1-semibold text-text-tertiary uppercase">Reason</span>
        <p className="text-body-regular text-text-secondary">{request.reason}</p>
      </div>
      <Textarea label="Note to the mentor" hint="Required when rejecting." value={note} onChange={setNote} rows={3} autoResize maxLength={2000} />
    </Modal>
  )
}

export function ChangeRequestsView() {
  const { user } = useAuth()
  const notify = useToast()
  const [status, setStatus] = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const { page, pageSize, setPage, setPageSize } = usePageParams(10)
  const requests = useResource('/change-requests', { status: status === 'all' ? undefined : status, page, page_size: pageSize })
  const isAdmin = user.role === 'admin'

  return (
    <>
      <PageHeader
        title="Change requests"
        description={isAdmin ? 'Mentors suggest lesson changes here. Approving creates a new draft version for you to edit and publish.' : 'Your suggestions for lesson changes and what DCCD decided. Start a new request from any lesson.'}
        actions={!isAdmin ? <RouterButton to="/lessons" variant="secondary">Browse lessons</RouterButton> : null}
      />
      <Tabs selectedKey={status} onSelectionChange={(key) => { setStatus(key); setPage(1) }}>
        <TabList aria-label="Filter by status">
          <Tab id="pending">Pending</Tab>
          <Tab id="approved">Approved</Tab>
          <Tab id="rejected">Rejected</Tab>
          <Tab id="all">All</Tab>
        </TabList>
      </Tabs>
      <DataState loading={requests.loading && !requests.data} error={requests.error} onRetry={requests.reload}>
        {requests.data?.items.length ? (
          <ul className="flex flex-col gap-2">
            {requests.data.items.map((request) => (
              <li key={request.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Link to={`/lessons/${request.lesson_id}`} className="text-headline-semibold text-text-primary hover:text-accent-700">{request.lesson_title} · v{request.lesson_version}</Link>
                    <span className="text-body-2-regular text-text-tertiary">{request.requested_by_name} · {formatDateTime(request.created_at)}</span>
                  </div>
                  <StatusChip value={request.status} />
                </div>
                <p className="text-body-regular text-text-primary">{request.proposed_change.summary}</p>
                <p className="text-body-2-regular text-text-secondary"><span className="text-text-tertiary">Reason: </span>{request.reason}</p>
                {request.status !== 'pending' ? (
                  <p className="rounded-2xl bg-background-secondary-default px-3 py-2 text-body-2-regular text-text-secondary">
                    {request.reviewed_by_name} {request.status} this on {formatDateTime(request.reviewed_at)}{request.review_note ? `: “${request.review_note}”` : '.'}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {isAdmin && request.status === 'pending' ? <Button size="small" onClick={() => setReviewing(request)}>Review</Button> : null}
                  {isAdmin && request.metadata?.draft_lesson_id ? <RouterButton size="small" variant="secondary" to={`/lessons/${request.metadata.draft_lesson_id}`}>Open draft</RouterButton> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {requests.data?.items.length ? <div className="surface px-3 py-2"><ListFooter data={requests.data} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} noun="requests" /></div> : null}
        {requests.data && !requests.data.items.length ? (
          <div className="surface">
            <EmptyState icon={RiEditBoxLine} title="Nothing here" description={status === 'pending' ? 'No requests are waiting for a decision.' : 'No requests with this status yet.'} />
          </div>
        ) : null}
      </DataState>
      {reviewing ? (
        <ReviewModal
          request={reviewing}
          onClose={() => setReviewing(null)}
          onDone={(_result, decision) => {
            setReviewing(null)
            notify(decision === 'approve' ? 'Approved. A new draft is ready to edit.' : 'Request rejected')
            requests.reload()
          }}
        />
      ) : null}
    </>
  )
}

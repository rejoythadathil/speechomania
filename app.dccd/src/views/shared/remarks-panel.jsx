import { RiChat3Line } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { Switch } from '@/components/base/switch/switch'
import { Textarea } from '@/components/base/textarea/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDateTime } from '@/utils/format'

function Composer({ initial, onSubmit, onCancel, submitLabel }) {
  const [body, setBody] = useState(initial?.body ?? '')
  const [shared, setShared] = useState(initial ? initial.visibility === 'shared' : false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({ body, visibility: shared ? 'shared' : 'internal' })
      if (!initial) {
        setBody('')
        setShared(false)
      }
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <FormAlert error={error} />
      <Textarea label={initial ? 'Edit remark' : 'Add a remark'} placeholder="What did you notice today?" value={body} onChange={setBody} rows={3} autoResize maxRows={10} maxLength={5000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switch isSelected={shared} onChange={setShared}>Share with parent</Switch>
        <div className="flex gap-2">
          {onCancel ? <Button variant="secondary" size="small" onClick={onCancel}>Cancel</Button> : null}
          <Button type="submit" size="small" disabled={pending || !body.trim()}>{pending ? 'Saving…' : submitLabel}</Button>
        </div>
      </div>
    </form>
  )
}

const PAGE_SIZE = 10

export function RemarksPanel({ childId }) {
  const { user } = useAuth()
  const notify = useToast()
  const [page, setPage] = useState(1)
  const remarks = useResource(`/children/${childId}/remarks`, { page, page_size: PAGE_SIZE })
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const canWrite = user.role === 'admin' || user.role === 'mentor'

  async function create(values) {
    await api(`/children/${childId}/remarks`, { method: 'POST', body: values })
    notify(values.visibility === 'shared' ? 'Remark added and shared with the parent' : 'Remark added')
    setPage(1)
    remarks.reload()
  }

  async function update(values) {
    await api(`/remarks/${editing}`, { method: 'PATCH', body: values })
    setEditing(null)
    notify('Remark updated')
    remarks.reload()
  }

  return (
    <Panel
      title={user.role === 'parent' ? 'Notes from DCCD' : 'Remarks'}
      footer={<ListFooter data={remarks.data} page={page} onPage={setPage} noun="remarks" />}
      description={user.role === 'parent' ? 'Notes your child’s mentor has shared with you.' : 'Internal remarks stay with DCCD staff. Shared remarks are visible to the parent.'}
    >
      <div className="flex flex-col gap-3">
        {canWrite ? <Composer onSubmit={create} submitLabel="Add remark" /> : null}
        <DataState loading={remarks.loading && !remarks.data} error={remarks.error} onRetry={remarks.reload}>
          {remarks.data?.items.length ? (
            <ol className="hairlines -mx-3 -mb-3 flex flex-col border-t border-[var(--line)]">
              {remarks.data.items.map((remark) => (
                <li key={remark.id} className="flex gap-3 px-3 py-3">
                  <UserAvatar seed={remark.author_avatar} name={remark.author_name} size={28} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body-medium text-text-primary">{remark.author_name}</span>
                      <StatusChip value={remark.author_role} />
                      {user.role !== 'parent' ? <StatusChip value={remark.visibility} /> : null}
                      <span className="text-caption-1-medium text-text-tertiary">{formatDateTime(remark.created_at)}</span>
                    </div>
                    {editing === remark.id ? (
                      <Composer initial={remark} onSubmit={update} onCancel={() => setEditing(null)} submitLabel="Save" />
                    ) : (
                      <p className="whitespace-pre-wrap text-body-regular text-text-secondary">{remark.body}</p>
                    )}
                    {editing !== remark.id && (remark.author_id === user.id || user.role === 'admin') ? (
                      <div className="flex gap-2">
                        {remark.author_id === user.id ? <Button variant="secondary" size="xs" onClick={() => setEditing(remark.id)}>Edit</Button> : null}
                        <Button variant="secondary" size="xs" onClick={() => setRemoving(remark)}>Delete</Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={RiChat3Line} title="No remarks yet" description={canWrite ? 'Add the first remark above.' : 'Your child’s mentor has not shared any notes yet.'} />
          )}
        </DataState>
      </div>
      <ConfirmDialog
        isOpen={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Delete this remark?"
        message="It will no longer be visible to anyone. The audit log keeps a record that it was deleted."
        confirmLabel="Delete remark"
        onConfirm={async () => {
          await api(`/remarks/${removing.id}`, { method: 'DELETE' })
          notify('Remark deleted')
          remarks.reload()
        }}
      />
    </Panel>
  )
}

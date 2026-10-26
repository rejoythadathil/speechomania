import { RiFileCopyLine, RiSearchLine, RiUserAddLine, RiUserLine } from '@remixicon/react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/base/table/table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { api, fieldErrors } from '@/services/api.js'
import { formatDate } from '@/utils/format'
import { NotFoundView } from '../shared/not-found.jsx'

const COPY = {
  mentor: { title: 'Mentors', singular: 'mentor', description: 'Therapists who look after a group of children and write remarks.' },
  parent: { title: 'Parents', singular: 'parent', description: 'Families who add their children and follow their progress.' },
  admin: { title: 'Admins', singular: 'admin', description: 'Speechomania staff with full access to the platform.' }
}

function InviteModal({ role, onClose, onInvited }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [invite, setInvite] = useState(null)
  const errors = fieldErrors(error)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const result = await api('/users', { method: 'POST', body: { ...form, role } })
      setInvite(result)
      onInvited()
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(invite.invite_link).catch(() => null)
  }

  if (invite) {
    return (
      <Modal isOpen onOpenChange={onClose} title="Invitation ready" description={`${invite.user.full_name} can now set a password and sign in.`} footer={<Button onClick={onClose}>Done</Button>}>
        <p className="text-body-regular text-text-secondary">Send this link to {invite.user.email}. It lets them choose a password.</p>
        <div className="flex items-center gap-2 rounded-2xl bg-background-secondary-default p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-body-2-regular text-text-primary">{invite.invite_link}</code>
          <Button variant="secondary" size="small" leadingIcon={RiFileCopyLine} onClick={copy}>Copy</Button>
        </div>
        {invite.invite_link_is_local ? <p className="text-caption-1-medium text-text-tertiary">Local development: this link opens the Firebase emulator.</p> : null}
      </Modal>
    )
  }

  return (
    <Modal
      isOpen
      onOpenChange={onClose}
      title={`Invite a ${COPY[role].singular}`}
      description="They get a link to set their own password. No one else ever sees it."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="invite-form" disabled={pending}>{pending ? 'Inviting…' : 'Send invite'}</Button></>}
    >
      <form id="invite-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <Input label="Full name" value={form.full_name} onChange={set('full_name')} autoFocus isRequired isInvalid={Boolean(errors.full_name)} hint={errors.full_name} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} isRequired isInvalid={Boolean(errors.email)} hint={errors.email} />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} isInvalid={Boolean(errors.phone)} hint={errors.phone ?? 'Optional'} />
      </form>
    </Modal>
  )
}

function EditModal({ person, onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: person.full_name, phone: person.phone ?? '', status: person.status === 'disabled' ? 'disabled' : 'active' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      onSaved(await api(`/users/${person.id}`, { method: 'PATCH', body: form }))
    } catch (caught) {
      setError(caught)
      setPending(false)
    }
  }

  return (
    <Modal
      isOpen
      onOpenChange={onClose}
      title={`Edit ${person.full_name}`}
      description={person.email}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="edit-person" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button></>}
    >
      <form id="edit-person" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <Input label="Full name" value={form.full_name} onChange={set('full_name')} isRequired isInvalid={Boolean(errors.full_name)} hint={errors.full_name} />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} isInvalid={Boolean(errors.phone)} hint={errors.phone} />
        <SelectField label="Access" options={[{ id: 'active', label: 'Can sign in' }, { id: 'disabled', label: 'Blocked from signing in' }]} value={form.status} onChange={set('status')} />
      </form>
    </Modal>
  )
}

export function PeopleView() {
  const { role } = useParams()
  const { user } = useAuth()
  const notify = useToast()
  const { page, pageSize, setPage, setPageSize, params } = usePageParams(20)
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const [modal, setModal] = useState(null)
  const q = useDebounced(search)
  const copy = COPY[role]
  const people = useResource(copy ? '/users' : null, { role, q, page, page_size: pageSize })
  if (!copy) return <NotFoundView />

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} actions={<Button leadingIcon={RiUserAddLine} onClick={() => setModal({ type: 'invite' })}>Invite {copy.singular}</Button>} />
      <Panel
        bodyClassName="p-0"
        toolbar={(
          <>
            <Input size="small" className="max-w-64" aria-label={`Search ${copy.title.toLowerCase()}`} placeholder="Search by name or email" leadingIcon={RiSearchLine} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
          </>
        )}
        footer={<ListFooter data={people.data} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} noun={copy.title.toLowerCase()} />}
      >
        <DataState loading={people.loading && !people.data} error={people.error} onRetry={people.reload}>
          {people.data?.items.length ? (
            <Table aria-label={copy.title}>
              <TableHeader>
                <TableColumn isRowHeader>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Joined</TableColumn>
                <TableColumn><span className="sr-only">Actions</span></TableColumn>
              </TableHeader>
              <TableBody items={people.data.items}>
                {(person) => (
                  <TableRow id={person.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <UserAvatar seed={person.metadata?.avatar ?? person.id} name={person.full_name} size={24} />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-body-medium text-text-primary">{person.full_name}{person.id === user.id ? ' (you)' : ''}</span>
                          <span className="truncate text-caption-1-medium text-text-tertiary">{person.email}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{person.phone || '—'}</TableCell>
                    <TableCell><StatusChip value={person.status} /></TableCell>
                    <TableCell>{formatDate(person.created_at)}</TableCell>
                    <TableCell>
                      <span className="flex justify-end gap-2">
                        <Button variant="secondary" size="xs" onClick={() => setModal({ type: 'edit', person })}>Edit</Button>
                        {person.id !== user.id ? <Button variant="secondary" size="xs" onClick={() => setModal({ type: 'remove', person })}>Remove</Button> : null}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={RiUserLine} title={q ? 'No one matches' : `No ${copy.title.toLowerCase()} yet`} description={`Invite a ${copy.singular} to get started.`} />
          )}
        </DataState>
      </Panel>
      {modal?.type === 'invite' ? <InviteModal role={role} onClose={() => setModal(null)} onInvited={people.reload} /> : null}
      {modal?.type === 'edit' ? <EditModal person={modal.person} onClose={() => setModal(null)} onSaved={() => { setModal(null); notify('Changes saved'); people.reload() }} /> : null}
      <ConfirmDialog
        isOpen={modal?.type === 'remove'}
        onOpenChange={() => setModal(null)}
        title={`Remove ${modal?.person?.full_name}?`}
        message={role === 'mentor' ? 'They can no longer sign in, and their children become unassigned. Their remarks stay on each child’s record.' : 'They can no longer sign in. Their history stays in the audit log.'}
        confirmLabel="Remove"
        onConfirm={async () => {
          await api(`/users/${modal.person.id}`, { method: 'DELETE' })
          notify(`${modal.person.full_name} was removed`)
          people.reload()
        }}
      />
    </>
  )
}

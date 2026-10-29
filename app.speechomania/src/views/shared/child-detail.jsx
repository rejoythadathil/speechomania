import { RiArrowLeftLine, RiBookOpenLine, RiLockLine, RiPencilLine, RiPlayLine } from '@remixicon/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Avatar } from '@/components/base/avatar/avatar'
import { Button } from '@/components/base/buttons/button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Chip } from '@/components/base/badges/chip'
import { Input } from '@/components/base/input/input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { PersonPicker } from '@/components/shared/person-picker.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api, fieldErrors } from '@/services/api.js'
import { age, formatDate, initials, titleCase } from '@/utils/format'
import { ChildFormModal } from './child-form.jsx'
import { RemarksPanel } from './remarks-panel.jsx'

const SENSORY_LABELS = {
  motion: { reduced: 'Reduced motion', normal: 'Normal motion' },
  sound: { normal: 'Normal sound', quiet: 'Quiet sound', off: 'Sound off' },
  colour: { low: 'Soft colours', normal: 'Full colours' }
}

function Detail({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption-1-medium text-text-tertiary">{label}</dt>
      <dd className="text-body-regular text-text-primary">{children}</dd>
    </div>
  )
}

function MentorModal({ child, isOpen, onOpenChange, onSaved }) {
  const [mentorId, setMentorId] = useState(child.mentor_id ?? 'none')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setPending(true)
    setError(null)
    try {
      onSaved(await api(`/children/${child.id}/mentor`, { method: 'PUT', body: { mentor_id: mentorId === 'none' ? null : mentorId } }))
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
      title="Assign a mentor"
      description="The previous mentor loses access straight away. Remarks stay with the child."
      footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button></>}
    >
      <FormAlert error={error} />
      <PersonPicker
        label="Mentor"
        role="mentor"
        placeholder="Search mentors by name or email"
        value={mentorId}
        initialLabel={child.mentor_name ?? 'No mentor'}
        extraOption={{ id: 'none', label: 'No mentor', detail: 'Leave this child without a mentor' }}
        onChange={setMentorId}
      />
    </Modal>
  )
}

function LessonsModal({ child, published, isOpen, onOpenChange, onSaved }) {
  const [selected, setSelected] = useState(() => new Set(child.assigned_lessons))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  function toggle(slug, on) {
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(slug)
      else next.delete(slug)
      return next
    })
  }

  async function save() {
    setPending(true)
    setError(null)
    try {
      const slugs = published.map((lesson) => lesson.slug).filter((slug) => selected.has(slug))
      onSaved(await api(`/children/${child.id}/lessons`, { method: 'PUT', body: { slugs } }))
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
      title={`Lessons for ${child.display_name}`}
      description="Only published lessons can be assigned. The child sees them in this order."
      footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save lessons'}</Button></>}
    >
      <FormAlert error={error} />
      {published.length ? (
        <div className="flex flex-col gap-2">
          {published.map((lesson) => (
            <Checkbox key={lesson.slug} isSelected={selected.has(lesson.slug)} onChange={(on) => toggle(lesson.slug, on)}>
              {lesson.title} <span className="text-text-tertiary">· {lesson.step_count} steps</span>
            </Checkbox>
          ))}
        </div>
      ) : (
        <p className="text-body-regular text-text-secondary">There are no published lessons yet.</p>
      )}
    </Modal>
  )
}

function PinModal({ child, isOpen, onOpenChange, onSaved }) {
  const [pin, setPin] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)

  async function save(value) {
    setPending(true)
    setError(null)
    try {
      onSaved(await api(`/children/${child.id}`, { method: 'PATCH', body: { pin: value } }))
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
      title="Learning PIN"
      description={`${child.display_name} needs a grown-up to leave the learning app. With a PIN, leaving asks for it; without one, a grown-up presses and holds the lock button.`}
      footer={(
        <>
          {child.has_pin ? <Button variant="secondary" onClick={() => save(null)} disabled={pending}>Remove PIN</Button> : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save(pin)} disabled={pending || pin.length !== 4}>{pending ? 'Saving…' : 'Save PIN'}</Button>
        </>
      )}
    >
      <FormAlert error={error && !Object.keys(errors).length ? error : null} />
      <Input
        label={child.has_pin ? 'New 4-digit PIN' : '4-digit PIN'}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))}
        isInvalid={Boolean(errors.pin)}
        hint={errors.pin ?? 'Only you should know it. It is stored hashed and never shown again.'}
        autoFocus
      />
    </Modal>
  )
}

export function ChildDetailView() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const notify = useToast()
  const child = useResource(`/children/${id}`)
  const lessons = useResource('/lessons', { status: 'published', page_size: 100 })
  const [modal, setModal] = useState(null)
  const published = (lessons.data?.items ?? []).filter((lesson) => lesson.status === 'published')
  const titleFor = (slug) => published.find((lesson) => lesson.slug === slug)?.title ?? titleCase(slug.replaceAll('-', ' '))
  const data = child.data
  const canEditProfile = user.role === 'admin' || user.role === 'parent'
  const canAssignLessons = user.role === 'admin' || user.role === 'mentor'

  function saved(message) {
    return () => {
      notify(message)
      child.reload()
    }
  }

  return (
    <>
      <Link to="/children" className="inline-flex w-fit items-center gap-1.5 text-body-2-medium text-text-secondary hover:text-text-primary">
        <RiArrowLeftLine className="size-4" aria-hidden />
        {user.role === 'admin' ? 'All children' : 'My children'}
      </Link>
      <DataState loading={child.loading && !data} error={child.error} onRetry={child.reload}>
        {data ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="lg" color="blue" initials={initials(data.display_name)} className="size-12 text-title-3-semibold" />
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-title-1-semibold text-text-primary">{data.display_name}</h1>
                    <StatusChip value={data.status} />
                  </div>
                  <span className="text-body-regular text-text-secondary">
                    {age(data.date_of_birth) !== null ? `${age(data.date_of_birth)} years old` : 'Age not recorded'}
                    {data.mentor_name ? ` · Mentor ${data.mentor_name}` : ' · No mentor yet'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.role === 'parent' && data.status === 'active' ? <Button leadingIcon={RiPlayLine} onClick={() => navigate(`/learn/${data.id}`)}>Start learning</Button> : null}
                {canEditProfile ? <Button variant="secondary" leadingIcon={RiPencilLine} onClick={() => setModal('edit')}>Edit profile</Button> : null}
                {user.role === 'parent' ? <Button variant="secondary" leadingIcon={RiLockLine} onClick={() => setModal('pin')}>{data.has_pin ? 'Change PIN' : 'Set PIN'}</Button> : null}
                {user.role === 'admin' ? <Button variant="secondary" onClick={() => setModal('mentor')}>{data.mentor_id ? 'Change mentor' : 'Assign mentor'}</Button> : null}
                {user.role === 'admin' && data.status !== 'archived' ? <Button variant="secondary" onClick={() => setModal('remove')}>Archive</Button> : null}
              </div>
            </header>
            <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <div className="flex flex-col gap-2.5">
                <Panel title="Profile">
                  <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Detail label="Date of birth">{formatDate(data.date_of_birth)}</Detail>
                    {user.role !== 'parent' ? <Detail label="Parent">{data.parent_name}<span className="block text-body-2-regular text-text-tertiary">{data.parent_email}</span></Detail> : null}
                    <Detail label="Mentor">{data.mentor_name ?? 'Not assigned'}</Detail>
                    <Detail label="Consent">Version {data.consent_version} · {formatDate(data.consent_at)}</Detail>
                    <Detail label="Enrolled">{formatDate(data.created_at)}</Detail>
                  </dl>
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-[var(--line)] pt-3">
                    <span className="text-caption-1-medium text-text-tertiary">Sensory settings in the learning app</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SENSORY_LABELS).map(([key, labels]) => (
                        <Chip key={key} variant="caption" color="blue">{labels[data.sensory_settings[key]] ?? `${titleCase(key)} not set`}</Chip>
                      ))}
                    </div>
                  </div>
                </Panel>
                <Panel title="Assigned lessons" actions={canAssignLessons ? <Button variant="secondary" size="small" onClick={() => setModal('lessons')} disabled={lessons.loading}>Change</Button> : null}>
                  {data.assigned_lessons.length ? (
                    <ol className="flex flex-col gap-1.5">
                      {data.assigned_lessons.map((slug, index) => (
                        <li key={slug} className="flex items-center gap-3">
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-accent-50 text-caption-1-semibold text-accent-700">{index + 1}</span>
                          <span className="text-body-regular text-text-primary">{titleFor(slug)}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <EmptyState icon={RiBookOpenLine} title="No lessons assigned" description={canAssignLessons ? 'Choose lessons for this child.' : 'Their mentor will assign lessons soon.'} />
                  )}
                </Panel>
              </div>
              <RemarksPanel childId={data.id} />
            </div>
            {modal === 'edit' ? <ChildFormModal isOpen onOpenChange={() => setModal(null)} child={data} onSaved={saved('Profile updated')} /> : null}
            {modal === 'pin' ? <PinModal isOpen onOpenChange={() => setModal(null)} child={data} onSaved={saved('PIN saved')} /> : null}
            {modal === 'mentor' ? <MentorModal isOpen onOpenChange={() => setModal(null)} child={data} onSaved={saved('Mentor updated')} /> : null}
            {modal === 'lessons' ? <LessonsModal isOpen onOpenChange={() => setModal(null)} child={data} published={published} onSaved={saved('Lessons updated')} /> : null}
            <ConfirmDialog
              isOpen={modal === 'remove'}
              onOpenChange={() => setModal(null)}
              title={`Archive ${data.display_name}?`}
              message="The child is hidden from mentors and the parent. Their records are kept for the retention period."
              confirmLabel="Archive child"
              onConfirm={async () => {
                await api(`/children/${data.id}`, { method: 'DELETE' })
                notify(`${data.display_name} was archived`)
                navigate('/children')
              }}
            />
          </>
        ) : null}
      </DataState>
    </>
  )
}

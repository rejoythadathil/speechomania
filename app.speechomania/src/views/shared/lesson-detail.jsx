import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowUpLine,
  RiDeleteBinLine,
  RiGitBranchLine,
  RiPlayLine
} from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { IconButton } from '@/components/base/buttons/icon-button'
import { Input } from '@/components/base/input/input'
import { Switch } from '@/components/base/switch/switch'
import { Textarea } from '@/components/base/textarea/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDate, formatDateTime } from '@/utils/format'
import { LessonPreview } from '@/views/child/preview-player.jsx'
import { GamePanel, LinesPanel, StepsPanel } from './lesson-content.jsx'

function StepFacts({ step }) {
  const facts = []
  if (step.word) facts.push(`Word: ${step.word}`)
  if (step.choices) facts.push(`${step.choices.join(' or ')} · answer: ${step.answer}`)
  if (typeof step.answer === 'boolean') facts.push(`Answer: ${step.answer ? 'yes' : 'no'}`)
  if (step.actor) facts.push(`${step.actor} acts out “${step.act}”`)
  if (step.image_key) facts.push('Picture')
  facts.push(step.audio?.key ? 'Voice ready' : 'No voice yet')
  return <p className="text-body-2-regular text-text-tertiary">{facts.join(' · ')}</p>
}

function StepEditor({ lesson, onSaved }) {
  const [title, setTitle] = useState(lesson.title)
  const [steps, setSteps] = useState(() =>
    lesson.content.steps.map((step) => ({ key: crypto.randomUUID(), ...step }))
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const fixedSteps = (lesson.content.player ?? 'story') !== 'story'
  const update = (key, text) =>
    setSteps((current) =>
      current.map((step) => (step.key === key ? { ...step, text, audio: null } : step))
    )
  const remove = (key) => setSteps((current) => current.filter((step) => step.key !== key))
  const move = (index, delta) =>
    setSteps((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })

  async function save() {
    setPending(true)
    setError(null)
    try {
      const content = {
        ...lesson.content,
        steps: steps.filter((step) => step.text.trim()).map(({ key: _key, ...step }) => step)
      }
      onSaved(await api(`/lessons/${lesson.id}`, { method: 'PATCH', body: { title, content } }))
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel
      title="Edit draft"
      description="Each step is one page of the lesson. Keep the language short and concrete."
      actions={
        <Button onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save draft'}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <FormAlert error={error} />
        <Input label="Title" value={title} onChange={setTitle} isRequired />
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <li key={step.key} className="inset flex gap-3 p-2">
              <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-caption-1-semibold text-accent-700">
                {index + 1}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <Textarea
                  aria-label={`Step ${index + 1}`}
                  value={step.text}
                  onChange={(text) => update(step.key, text)}
                  rows={2}
                  autoResize
                  maxLength={500}
                />
                <StepFacts step={step} />
              </div>
              <div className="flex flex-col gap-1">
                <IconButton
                  size="small"
                  icon={RiArrowUpLine}
                  aria-label={`Move step ${index + 1} up`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                />
                <IconButton
                  size="small"
                  icon={RiArrowDownLine}
                  aria-label={`Move step ${index + 1} down`}
                  onClick={() => move(index, 1)}
                  disabled={index === steps.length - 1}
                />
                <IconButton
                  size="small"
                  icon={RiDeleteBinLine}
                  aria-label={`Remove step ${index + 1}`}
                  onClick={() => remove(step.key)}
                />
              </div>
            </li>
          ))}
        </ol>
        {fixedSteps ? null : (
          <Button
            variant="secondary"
            leadingIcon={RiAddLine}
            className="self-start"
            onClick={() =>
              setSteps((current) => [...current, { key: crypto.randomUUID(), text: '' }])
            }
          >
            Add step
          </Button>
        )}
      </div>
    </Panel>
  )
}

function RequestChangeModal({ lesson, isOpen, onOpenChange }) {
  const notify = useToast()
  const navigate = useNavigate()
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api('/change-requests', {
        method: 'POST',
        body: { lesson_id: lesson.id, reason, proposed_change: { summary } }
      })
      notify('Change request sent to Speechomania admins')
      navigate('/change-requests')
    } catch (caught) {
      setError(caught)
      setPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Request a change"
      description={`${lesson.title} · v${lesson.version}. An admin will approve or reject it.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="change-form"
            disabled={pending || !reason.trim() || !summary.trim()}
          >
            {pending ? 'Sending…' : 'Send request'}
          </Button>
        </>
      }
    >
      <form id="change-form" onSubmit={submit} className="flex flex-col gap-4">
        <FormAlert error={error} />
        <Textarea
          label="What should change?"
          value={summary}
          onChange={setSummary}
          rows={3}
          autoResize
          maxLength={4000}
          isRequired
        />
        <Textarea
          label="Why?"
          placeholder="What did you see with the children?"
          value={reason}
          onChange={setReason}
          rows={3}
          autoResize
          maxLength={2000}
          isRequired
        />
      </form>
    </Modal>
  )
}

const QUESTION_OPTIONS = [3, 5, 10].map((count) => ({
  id: String(count),
  label: `${count} questions`
}))

function FlowPanel({ lesson, editable, onChanged }) {
  const notify = useToast()
  const [pending, setPending] = useState(false)
  const player = lesson.content.player ?? 'story'
  const story = player === 'story'
  const after = lesson.content.after

  async function save(check) {
    setPending(true)
    try {
      await api(`/lessons/${lesson.id}/check`, { method: 'PATCH', body: check })
      onChanged()
      notify(check.enabled ? 'Quick check is on' : 'Quick check is off')
    } catch (error) {
      notify(error.message, { status: 'error' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel title="Lesson flow" description="What a child goes through, in order">
      <ol className="flex flex-col gap-3 text-body-2-regular text-text-secondary">
        {after ? (
          <li>
            <span className="text-body-2-medium text-text-primary">Opens after</span> · {after},
            once the child has finished it
          </li>
        ) : null}
        {player === 'cards' ? (
          <li>
            <span className="text-body-2-medium text-text-primary">Flashcards</span> ·{' '}
            {lesson.cards.length} cards, each flips and is read aloud. The game is the part 2
            lesson.
          </li>
        ) : (
          <li>
            <span className="text-body-2-medium text-text-primary">{story ? 'Story' : 'Game'}</span>{' '}
            · {lesson.step_count} {story ? 'pages' : 'activities'}
          </li>
        )}
        <li className={player === 'cards' ? 'hidden' : 'flex flex-col gap-2'}>
          <span>
            <span className="text-body-2-medium text-text-primary">Quick check</span> ·{' '}
            {story
              ? 'not for story lessons'
              : lesson.check
                ? `${lesson.check.questions} questions, one try each, no hints`
                : 'off'}
          </span>
          {editable && !story ? (
            <span className="flex flex-wrap items-center gap-3">
              <Switch
                size="sm"
                isSelected={Boolean(lesson.check)}
                isDisabled={pending}
                onChange={(enabled) => save({ enabled, questions: lesson.check?.questions ?? 5 })}
              >
                Ask questions at the end
              </Switch>
              {lesson.check ? (
                <SelectField
                  size="sm"
                  className="w-40"
                  options={QUESTION_OPTIONS}
                  value={String(lesson.check.questions)}
                  onChange={(value) => save({ enabled: true, questions: Number(value) })}
                />
              ) : null}
            </span>
          ) : null}
        </li>
      </ol>
    </Panel>
  )
}

export function LessonDetailView() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const notify = useToast()
  const isAdmin = user.role === 'admin'
  const lesson = useResource(`/lessons/${id}`)
  const [versionPage, setVersionPage] = useState(1)
  const versions = useResource(isAdmin ? `/lessons/${id}/versions` : null, {
    page: versionPage,
    page_size: 10
  })
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)
  const [previewing, setPreviewing] = useState(false)

  useEffect(() => setData(lesson.data), [lesson.data])

  async function action(path, message) {
    const result = await api(`/lessons/${data.id}${path}`, { method: 'POST' })
    notify(message)
    if (result.id !== data.id) navigate(`/lessons/${result.id}`)
    else {
      lesson.reload()
      versions.reload()
    }
  }

  return (
    <>
      <Link
        to={user.role === 'parent' ? '/children' : '/lessons'}
        className="inline-flex w-fit items-center gap-1.5 text-body-2-medium text-text-secondary hover:text-text-primary"
      >
        <RiArrowLeftLine className="size-4" aria-hidden />
        {user.role === 'parent' ? 'My children' : 'All lessons'}
      </Link>
      <DataState loading={lesson.loading && !data} error={lesson.error} onRetry={lesson.reload}>
        {data ? (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-caption-1-semibold tracking-wide text-accent-700 uppercase">
                  {data.slug} · version {data.version}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-title-1-semibold text-text-primary">
                    {data.title}
                  </h1>
                  <StatusChip value={data.status} />
                </div>
                <span className="text-body-2-regular text-text-secondary">
                  Created by {data.created_by_name} on {formatDate(data.created_at)}
                  {data.published_at
                    ? ` · Published ${formatDateTime(data.published_at)} by ${data.published_by_name}`
                    : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.content.steps.length ? (
                  <Button
                    variant="secondary"
                    leadingIcon={RiPlayLine}
                    onClick={() => setPreviewing(true)}
                  >
                    Play preview
                  </Button>
                ) : null}
                {isAdmin && data.status === 'draft' ? (
                  <>
                    <Button variant="secondary" onClick={() => setModal('delete')}>
                      Delete draft
                    </Button>
                    <Button onClick={() => setModal('publish')}>Publish</Button>
                  </>
                ) : null}
                {isAdmin && data.status === 'published' ? (
                  <>
                    <Button variant="secondary" onClick={() => setModal('archive')}>
                      Archive
                    </Button>
                    <Button
                      leadingIcon={RiGitBranchLine}
                      onClick={() =>
                        action('/draft', 'New draft created').catch((error) =>
                          notify(error.message, { status: 'error' })
                        )
                      }
                    >
                      New version
                    </Button>
                  </>
                ) : null}
                {user.role === 'mentor' ? (
                  <Button onClick={() => setModal('request')}>Request a change</Button>
                ) : null}
              </div>
            </header>
            <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-2.5">
                <GamePanel lesson={data} />
                {isAdmin && data.status === 'draft' ? (
                  <StepEditor
                    key={data.id}
                    lesson={data}
                    onSaved={(saved) => {
                      setData(saved)
                      notify('Draft saved')
                    }}
                  />
                ) : null}
                {isAdmin &&
                data.status === 'draft' &&
                (data.content.player ?? 'story') === 'story' ? null : (
                  <StepsPanel key={data.id} lesson={data} />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-2.5">
                <FlowPanel
                  lesson={data}
                  editable={isAdmin && ['draft', 'published'].includes(data.status)}
                  onChanged={lesson.reload}
                />
                {isAdmin ? (
                  <Panel
                    title="Versions"
                    bodyClassName="p-0"
                    footer={
                      <ListFooter
                        data={versions.data}
                        page={versionPage}
                        onPage={setVersionPage}
                        noun="versions"
                      />
                    }
                  >
                    <DataState
                      loading={versions.loading && !versions.data}
                      error={versions.error}
                      onRetry={versions.reload}
                    >
                      <ul className="hairlines flex flex-col">
                        {(versions.data?.items ?? []).map((version) => (
                          <li key={version.id}>
                            <Link
                              to={`/lessons/${version.id}`}
                              className={`flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-[var(--surface-muted)] ${version.id === data.id ? 'bg-accent-50' : ''}`}
                            >
                              <span className="text-body-medium text-text-primary">
                                Version {version.version}
                              </span>
                              <StatusChip value={version.status} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </DataState>
                  </Panel>
                ) : null}
                <LinesPanel lesson={data} />
              </div>
            </div>
            <ConfirmDialog
              isOpen={modal === 'publish'}
              onOpenChange={() => setModal(null)}
              tone="primary"
              title="Publish this version?"
              message="Children assigned this lesson will get this version from now on. The current published version is kept as history."
              confirmLabel="Publish"
              onConfirm={() => action('/publish', 'Lesson published')}
            />
            <ConfirmDialog
              isOpen={modal === 'delete'}
              onOpenChange={() => setModal(null)}
              title="Delete this draft?"
              message="The draft and its unsaved steps are removed. Published versions are not affected."
              confirmLabel="Delete draft"
              onConfirm={async () => {
                await api(`/lessons/${data.id}`, { method: 'DELETE' })
                notify('Draft deleted')
                navigate('/lessons')
              }}
            />
            <ConfirmDialog
              isOpen={modal === 'archive'}
              onOpenChange={() => setModal(null)}
              title="Archive this lesson?"
              message="It can no longer be assigned. Children’s past progress on it is kept."
              confirmLabel="Archive"
              onConfirm={async () => {
                await api(`/lessons/${data.id}`, { method: 'DELETE' })
                notify('Lesson archived')
                lesson.reload()
                versions.reload()
              }}
            />
            {previewing ? (
              <LessonPreview lesson={data} onClose={() => setPreviewing(false)} />
            ) : null}
            {modal === 'request' ? (
              <RequestChangeModal lesson={data} isOpen onOpenChange={() => setModal(null)} />
            ) : null}
          </>
        ) : null}
      </DataState>
    </>
  )
}

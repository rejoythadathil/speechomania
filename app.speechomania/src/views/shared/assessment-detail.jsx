import { RiArrowLeftLine, RiPlayLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Textarea } from '@/components/base/textarea/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDate, formatDateTime } from '@/utils/format'
import { AssessmentPreview } from '@/views/child/preview-player.jsx'
import { QuestionsEditor } from './assessment-builder.jsx'
import { AssignPanel, ResultsSection } from './assessment-results.jsx'
import { SettingsPanel } from './assessment-settings.jsx'
import { StepCard } from './lesson-content.jsx'

const QUESTIONS_PER_PAGE = 10

function QuestionsPanel({ assessment }) {
  const [page, setPage] = useState(1)
  const items = assessment.items
  const start = (page - 1) * QUESTIONS_PER_PAGE
  const data = {
    items: items.slice(start, start + QUESTIONS_PER_PAGE),
    page,
    page_size: QUESTIONS_PER_PAGE,
    total: items.length,
    total_pages: Math.max(1, Math.ceil(items.length / QUESTIONS_PER_PAGE))
  }
  return (
    <Panel
      title="Questions"
      description={`${items.length} questions · ${assessment.max_score} points`}
      footer={<ListFooter data={data} page={page} onPage={setPage} noun="questions" />}
    >
      <ol className="grid gap-2 md:grid-cols-2">
        {data.items.map((item, offset) => (
          <StepCard
            key={start + offset}
            player={item.player}
            step={item.step}
            index={start + offset}
          />
        ))}
      </ol>
    </Panel>
  )
}

const toInput = ({ lesson_id: lessonId, step_index: stepIndex, points }) => ({
  lesson_id: lessonId,
  step_index: stepIndex,
  ...(points ? { points } : {})
})

function DraftEditor({ assessment, onSaved }) {
  const notify = useToast()
  const [title, setTitle] = useState(assessment.title)
  const [description, setDescription] = useState(assessment.description ?? '')
  const [items, setItems] = useState(assessment.items)
  const [settings, setSettings] = useState(assessment.settings)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setPending(true)
    setError(null)
    try {
      const saved = await api(`/assessments/${assessment.id}`, {
        method: 'PATCH',
        body: { title, description, settings, items: items.map(toInput) }
      })
      setItems(saved.items)
      onSaved(saved)
      notify('Draft saved')
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-2.5">
        <Panel
          title="Details"
          actions={
            <Button onClick={save} disabled={pending || !title.trim()}>
              {pending ? 'Saving…' : 'Save draft'}
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <FormAlert error={error} />
            <Input label="Title" value={title} onChange={setTitle} isRequired />
            <Textarea
              label="Notes for mentors (optional)"
              value={description}
              onChange={setDescription}
              rows={2}
              autoResize
              maxLength={2000}
            />
          </div>
        </Panel>
        <QuestionsEditor
          items={items}
          defaultPoints={settings.scoring.points}
          onChange={setItems}
        />
      </div>
      <SettingsPanel settings={settings} onChange={setSettings} />
    </div>
  )
}

export function AssessmentDetailView() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const notify = useToast()
  const isAdmin = user.role === 'admin'
  const resource = useResource(`/assessments/${id}`)
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => setData(resource.data), [resource.data])

  async function act(path, method, message) {
    await api(`/assessments/${data.id}${path}`, { method })
    notify(message)
    resource.reload()
  }

  return (
    <>
      <Link
        to="/assessments"
        className="inline-flex w-fit items-center gap-1.5 text-body-2-medium text-text-secondary hover:text-text-primary"
      >
        <RiArrowLeftLine className="size-4" aria-hidden />
        All assessments
      </Link>
      <DataState
        loading={resource.loading && !data}
        error={resource.error}
        onRetry={resource.reload}
      >
        {data ? (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-caption-1-semibold tracking-wide text-accent-700 uppercase">
                  Assessment · {data.question_count} questions · {data.max_score} points
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
                {data.description ? (
                  <p className="max-w-3xl text-body-2-regular text-text-secondary">
                    {data.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.items.length ? (
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
                  <Button variant="secondary" onClick={() => setModal('archive')}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </header>

            {isAdmin && data.status === 'draft' ? (
              <DraftEditor key={data.id} assessment={data} onSaved={setData} />
            ) : (
              <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-2.5">
                  <ResultsSection
                    key={version}
                    assessment={data}
                    onChanged={() => setVersion((current) => current + 1)}
                  />
                  <QuestionsPanel assessment={data} />
                </div>
                <div className="flex min-w-0 flex-col gap-2.5">
                  {data.status === 'published' ? (
                    <AssignPanel
                      assessment={data}
                      onAssigned={() => setVersion((current) => current + 1)}
                    />
                  ) : null}
                  <SettingsPanel settings={data.settings} />
                </div>
              </div>
            )}

            {previewing ? (
              <AssessmentPreview assessment={data} onClose={() => setPreviewing(false)} />
            ) : null}
            <ConfirmDialog
              isOpen={modal === 'publish'}
              onOpenChange={() => setModal(null)}
              tone="primary"
              title="Publish this assessment?"
              message="Save the draft first. Once published, its questions and settings are fixed and mentors can assign it."
              confirmLabel="Publish"
              onConfirm={() => act('/publish', 'POST', 'Assessment published')}
            />
            <ConfirmDialog
              isOpen={modal === 'delete'}
              onOpenChange={() => setModal(null)}
              title="Delete this draft?"
              message="The draft and its questions are removed."
              confirmLabel="Delete draft"
              onConfirm={async () => {
                await api(`/assessments/${data.id}`, { method: 'DELETE' })
                notify('Draft deleted')
                navigate('/assessments')
              }}
            />
            <ConfirmDialog
              isOpen={modal === 'archive'}
              onOpenChange={() => setModal(null)}
              title="Archive this assessment?"
              message="It can no longer be assigned or started. Results are kept."
              confirmLabel="Archive"
              onConfirm={() => act('', 'DELETE', 'Assessment archived')}
            />
          </>
        ) : null}
      </DataState>
    </>
  )
}

import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiSearchLine
} from '@remixicon/react'
import { useState } from 'react'
import { Chip } from '@/components/base/badges/chip'
import { Button } from '@/components/base/buttons/button'
import { IconButton } from '@/components/base/buttons/icon-button'
import { Input } from '@/components/base/input/input'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@/components/base/table/table'
import { sceneFor } from '@/components/child/scenes.js'
import { ChildPicker } from '@/components/shared/child-picker.jsx'
import { ConfirmDialog } from '@/components/shared/confirm-dialog.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatCard, StatStrip } from '@/components/shared/stat-card.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDate, formatDateTime } from '@/utils/format'

const RESULT_OPTIONS = [
  { id: 'all', label: 'Everyone' },
  { id: 'not_started', label: 'Not started' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' }
]

const QUESTIONS_PER_PAGE = 10

const percentText = (value) => (value === null || value === undefined ? '—' : `${value}%`)

export function ScoreText({ latest }) {
  if (!latest) return <span className="text-text-tertiary">—</span>
  if (latest.score === undefined) return <span className="text-text-tertiary">Hidden</span>
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="tabular-nums text-text-primary">
        {latest.score} / {latest.max_score}
      </span>
      <span className="text-text-tertiary tabular-nums">{latest.percent}%</span>
      {latest.passed === true ? (
        <Chip variant="caption" color="lime">
          Passed
        </Chip>
      ) : null}
      {latest.passed === false ? (
        <Chip variant="caption" color="rose">
          Below pass mark
        </Chip>
      ) : null}
    </span>
  )
}

function SummaryPanel({ summary }) {
  return (
    <StatStrip className="md:grid-cols-5 xl:grid-cols-5 [&>*:last-child]:col-span-1">
      <StatCard label="Assigned" value={summary.assigned} />
      <StatCard label="Started" value={summary.started} />
      <StatCard label="Completed" value={summary.completed} />
      <StatCard label="Average score" value={percentText(summary.average_percent)} />
      <StatCard label="Pass rate" value={percentText(summary.pass_rate)} />
    </StatStrip>
  )
}

function QuestionAccuracy({ questions }) {
  const [page, setPage] = useState(1)
  const start = (page - 1) * QUESTIONS_PER_PAGE
  const data = {
    items: questions.slice(start, start + QUESTIONS_PER_PAGE),
    page,
    page_size: QUESTIONS_PER_PAGE,
    total: questions.length,
    total_pages: Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE))
  }
  return (
    <Panel
      title="Question results"
      description="How often each question was answered right on the first try"
      bodyClassName="p-0"
      footer={<ListFooter data={data} page={page} onPage={setPage} noun="questions" />}
    >
      <ul className="hairlines flex flex-col">
        {data.items.map((question) => (
          <li key={question.index} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="flex min-w-0 flex-col">
              <span className="text-body-2-medium text-text-primary">
                {question.index + 1}. {question.text}
              </span>
              <span className="text-caption-1-medium text-text-tertiary">
                {question.lesson_title} · {sceneFor(question.player).tag}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="text-body-2-semibold tabular-nums text-text-primary">
                {percentText(question.accuracy)}
              </span>
              <span className="text-caption-1-medium text-text-tertiary">
                {question.answered} answered
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function seconds(ms) {
  return ms === undefined ? null : `${Math.max(1, Math.round(ms / 1000))}s`
}

export function AttemptModal({ attemptId, onClose }) {
  const attempt = useResource(`/assessment-attempts/${attemptId}`)
  const data = attempt.data
  return (
    <Modal
      isOpen
      size="wide"
      onOpenChange={onClose}
      title={data ? `${data.child_name} · ${data.title}` : 'Attempt'}
      description={data ? `Finished ${formatDateTime(data.completed_at)}` : null}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <DataState loading={attempt.loading && !data} error={attempt.error} onRetry={attempt.reload}>
        {data ? (
          <div className="flex flex-col gap-3">
            {data.score_hidden ? (
              <p className="text-body-2-regular text-text-secondary">
                The score of this assessment is not shared with parents.
              </p>
            ) : (
              <ScoreText latest={data.result} />
            )}
            {data.score_hidden ? null : (
              <ol className="hairlines flex flex-col">
                {data.questions.map((question) => {
                  const response = question.response
                  const details = response
                    ? [
                        response.choice !== undefined ? `Tapped “${response.choice}”` : null,
                        response.wrongs
                          ? `${response.wrongs} wrong ${response.wrongs === 1 ? 'try' : 'tries'}`
                          : null,
                        seconds(response.latency_ms)
                      ].filter(Boolean)
                    : []
                  return (
                    <li
                      key={question.index}
                      className="flex items-start justify-between gap-3 py-2"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="text-body-2-medium text-text-primary">
                          {question.index + 1}. {question.text}
                        </span>
                        <span className="text-caption-1-medium text-text-tertiary">
                          Answer:{' '}
                          {String(
                            question.answer === true
                              ? 'Yes'
                              : question.answer === false
                                ? 'No'
                                : question.answer
                          )}
                          {details.length ? ` · ${details.join(' · ')}` : ''}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {response ? (
                          <Chip variant="caption" color={response.correct ? 'lime' : 'rose'}>
                            {response.correct ? (
                              <RiCheckLine className="size-3.5" aria-label="Right" />
                            ) : (
                              <RiCloseLine className="size-3.5" aria-label="Wrong" />
                            )}
                          </Chip>
                        ) : (
                          <Chip variant="caption">Not answered</Chip>
                        )}
                        <span className="text-caption-1-medium tabular-nums text-text-tertiary">
                          {response?.points ?? 0}/{question.max_points}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        ) : null}
      </DataState>
    </Modal>
  )
}

function ChildResults({ assessment, onChanged }) {
  const notify = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewing, setViewing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const q = useDebounced(search)
  const results = useResource(`/assessments/${assessment.id}/results`, {
    q,
    status: status === 'all' ? undefined : status,
    page,
    page_size: pageSize
  })

  return (
    <Panel
      title="Children"
      description="Each assigned child and their latest finished attempt"
      bodyClassName="p-0"
      toolbar={
        <>
          <Input
            size="small"
            className="max-w-56"
            aria-label="Search children"
            placeholder="Search children"
            leadingIcon={RiSearchLine}
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
          <SelectField
            size="sm"
            className="w-40"
            options={RESULT_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          />
        </>
      }
      footer={
        <ListFooter
          data={results.data}
          page={page}
          onPage={setPage}
          pageSize={pageSize}
          onPageSize={setPageSize}
          noun={results.data?.total === 1 ? 'child' : 'children'}
        />
      }
    >
      <DataState
        loading={results.loading && !results.data}
        error={results.error}
        onRetry={results.reload}
      >
        {results.data?.items.length ? (
          <Table aria-label="Results">
            <TableHeader>
              <TableColumn isRowHeader>Child</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Latest score</TableColumn>
              <TableColumn>Attempts</TableColumn>
              <TableColumn>Due</TableColumn>
              <TableColumn> </TableColumn>
            </TableHeader>
            <TableBody items={results.data.items.map((row) => ({ ...row, id: row.child_id }))}>
              {(row) => (
                <TableRow id={row.child_id}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="text-body-medium text-text-primary">{row.display_name}</span>
                      <span className="text-caption-1-medium text-text-tertiary">
                        {row.mentor_name ? `Mentor ${row.mentor_name}` : 'No mentor'}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={row.status} />
                  </TableCell>
                  <TableCell>
                    <ScoreText latest={row.latest} />
                  </TableCell>
                  <TableCell>{row.attempts}</TableCell>
                  <TableCell>{formatDate(row.due_on)}</TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-1">
                      {row.latest ? (
                        <IconButton
                          size="small"
                          icon={RiEyeLine}
                          aria-label={`See ${row.display_name}'s answers`}
                          onClick={() => setViewing(row.latest.attempt_id)}
                        />
                      ) : null}
                      {assessment.status === 'published' ? (
                        <IconButton
                          size="small"
                          icon={RiDeleteBinLine}
                          aria-label={`Remove ${row.display_name}`}
                          onClick={() => setRemoving(row)}
                        />
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={RiSearchLine}
            title="No children here"
            description="Assign this assessment to children to see their results."
          />
        )}
      </DataState>
      {viewing ? <AttemptModal attemptId={viewing} onClose={() => setViewing(null)} /> : null}
      <ConfirmDialog
        isOpen={Boolean(removing)}
        onOpenChange={() => setRemoving(null)}
        title={`Remove ${removing?.display_name ?? ''}?`}
        message="The assessment leaves their list. Results they already have are kept."
        confirmLabel="Remove"
        onConfirm={async () => {
          await api(`/assessments/${assessment.id}/assignments/${removing.child_id}`, {
            method: 'DELETE'
          })
          notify('Assignment removed')
          onChanged()
        }}
      />
    </Panel>
  )
}

export function AssignPanel({ assessment, onAssigned }) {
  const notify = useToast()
  const [children, setChildren] = useState([])
  const [pickerKey, setPickerKey] = useState(0)
  const [dueOn, setDueOn] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function assign() {
    setPending(true)
    setError(null)
    try {
      await api(`/assessments/${assessment.id}/assignments`, {
        method: 'POST',
        body: { child_ids: children.map((child) => child.id), due_on: dueOn || null }
      })
      notify(`Assigned to ${children.length} ${children.length === 1 ? 'child' : 'children'}`)
      setChildren([])
      setDueOn('')
      onAssigned()
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel title="Assign" description="Children see it on their learning page">
      <div className="flex flex-col gap-3">
        <FormAlert error={error} />
        <ChildPicker
          key={pickerKey}
          label="Add a child"
          placeholder="Search children"
          onChange={(id) => {
            setPickerKey((current) => current + 1)
            if (children.some((child) => child.id === id)) return
            api(`/children/${id}`).then((child) =>
              setChildren((current) => [...current, { id, name: child.display_name }])
            )
          }}
        />
        {children.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {children.map((child) => (
              <li key={child.id}>
                <Chip variant="caption" color="gray" className="gap-1">
                  {child.name}
                  <button
                    type="button"
                    aria-label={`Remove ${child.name}`}
                    onClick={() =>
                      setChildren((current) => current.filter((item) => item.id !== child.id))
                    }
                  >
                    <RiCloseLine className="size-3.5" aria-hidden />
                  </button>
                </Chip>
              </li>
            ))}
          </ul>
        ) : null}
        <Input label="Due date (optional)" type="date" value={dueOn} onChange={setDueOn} />
        <Button onClick={assign} disabled={pending || !children.length}>
          {pending ? 'Assigning…' : 'Assign'}
        </Button>
      </div>
    </Panel>
  )
}

export function ResultsSection({ assessment, onChanged }) {
  const summary = useResource(`/assessments/${assessment.id}/summary`)
  return (
    <div className="flex flex-col gap-2.5">
      <DataState
        loading={summary.loading && !summary.data}
        error={summary.error}
        onRetry={summary.reload}
      >
        {summary.data ? <SummaryPanel summary={summary.data} /> : null}
      </DataState>
      <ChildResults assessment={assessment} onChanged={onChanged} />
      {summary.data?.questions.length ? (
        <QuestionAccuracy questions={summary.data.questions} />
      ) : null}
    </div>
  )
}

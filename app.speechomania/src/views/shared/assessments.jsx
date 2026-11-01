import { RiAddLine, RiClipboardLine, RiSearchLine } from '@remixicon/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@/components/base/table/table'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { api, fieldErrors } from '@/services/api.js'
import { formatDate } from '@/utils/format'

const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' }
]

const MENTOR_OPTIONS = STATUS_OPTIONS.filter((option) => option.id !== 'draft')

function NewAssessmentModal({ isOpen, onOpenChange }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const assessment = await api('/assessments', { method: 'POST', body: { title } })
      navigate(`/assessments/${assessment.id}`)
    } catch (caught) {
      setError(caught)
      setPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="New assessment"
      description="It starts as a draft. Pick questions from lessons, set the scoring, then publish it."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-form" disabled={pending || !title.trim()}>
            {pending ? 'Creating…' : 'Create draft'}
          </Button>
        </>
      }
    >
      <form id="assessment-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <Input
          label="Title"
          value={title}
          autoFocus
          isRequired
          onChange={setTitle}
          isInvalid={Boolean(errors.title)}
          hint={errors.title}
        />
      </form>
    </Modal>
  )
}

export function AssessmentsView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const [status, setStatus] = useState(isAdmin ? 'all' : 'published')
  const { page, pageSize, setPage, setPageSize, params } = usePageParams(20)
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const [creating, setCreating] = useState(false)
  const q = useDebounced(search)
  const assessments = useResource('/assessments', {
    q,
    status: status === 'all' ? undefined : status,
    page,
    page_size: pageSize
  })

  return (
    <>
      <PageHeader
        title="Assessments"
        description={
          isAdmin
            ? 'Build assessments from lesson questions, set how they are scored, and see every result.'
            : 'Give assessments to your children and follow their scores.'
        }
        actions={
          isAdmin ? (
            <Button leadingIcon={RiAddLine} onClick={() => setCreating(true)}>
              New assessment
            </Button>
          ) : null
        }
      />
      <Panel
        bodyClassName="p-0"
        toolbar={
          <>
            <Input
              size="small"
              className="max-w-64"
              aria-label="Search assessments"
              placeholder="Search assessments"
              leadingIcon={RiSearchLine}
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
            />
            <SelectField
              size="sm"
              className="w-44"
              options={isAdmin ? STATUS_OPTIONS : MENTOR_OPTIONS}
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
            data={assessments.data}
            page={page}
            onPage={setPage}
            pageSize={pageSize}
            onPageSize={setPageSize}
            noun="assessments"
          />
        }
      >
        <DataState
          loading={assessments.loading && !assessments.data}
          error={assessments.error}
          onRetry={assessments.reload}
        >
          {assessments.data?.items.length ? (
            <Table aria-label="Assessments" onRowAction={(id) => navigate(`/assessments/${id}`)}>
              <TableHeader>
                <TableColumn isRowHeader>Assessment</TableColumn>
                <TableColumn>Questions</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>{isAdmin ? 'Assigned' : 'My children'}</TableColumn>
                <TableColumn>Completed</TableColumn>
                <TableColumn>Published</TableColumn>
              </TableHeader>
              <TableBody items={assessments.data.items}>
                {(assessment) => (
                  <TableRow id={assessment.id} className="cursor-pointer">
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="text-body-medium text-text-primary">
                          {assessment.title}
                        </span>
                        <span className="text-caption-1-medium text-text-tertiary">
                          {assessment.max_score} points
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{assessment.question_count}</TableCell>
                    <TableCell>
                      <StatusChip value={assessment.status} />
                    </TableCell>
                    <TableCell>{assessment.assigned}</TableCell>
                    <TableCell>{assessment.completed}</TableCell>
                    <TableCell>{formatDate(assessment.published_at)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={RiClipboardLine}
              title="No assessments found"
              description={
                isAdmin
                  ? 'Create the first assessment to get started.'
                  : 'No assessments have been published yet.'
              }
            />
          )}
        </DataState>
      </Panel>
      {creating ? <NewAssessmentModal isOpen onOpenChange={setCreating} /> : null}
    </>
  )
}

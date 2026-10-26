import { RiAddLine, RiBookOpenLine, RiSearchLine } from '@remixicon/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/base/table/table'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
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

const STATUS_OPTIONS = ['all', 'published', 'draft', 'superseded', 'archived'].map((id) => ({ id, label: id === 'all' ? 'All versions' : id[0].toUpperCase() + id.slice(1) }))

const slugify = (text) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

function NewLessonModal({ isOpen, onOpenChange }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const lesson = await api('/lessons', { method: 'POST', body: { title, slug } })
      navigate(`/lessons/${lesson.id}`)
    } catch (caught) {
      setError(caught)
      setPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="New lesson"
      description="It starts as a draft. Add steps, then publish it."
      footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="lesson-form" disabled={pending || !title || !slug}>{pending ? 'Creating…' : 'Create draft'}</Button></>}
    >
      <form id="lesson-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <Input label="Title" value={title} autoFocus isRequired onChange={(value) => { setTitle(value); if (!slugTouched) setSlug(slugify(value)) }} isInvalid={Boolean(errors.title)} hint={errors.title} />
        <Input label="Short name" value={slug} isRequired onChange={(value) => { setSlugTouched(true); setSlug(value) }} isInvalid={Boolean(errors.slug)} hint={errors.slug ?? 'Used to link versions of the same lesson. Lowercase letters, numbers and hyphens.'} />
      </form>
    </Modal>
  )
}

export function LessonsView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const [status, setStatus] = useState(isAdmin ? 'all' : 'published')
  const { page, pageSize, setPage, setPageSize, params } = usePageParams(20)
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const [creating, setCreating] = useState(false)
  const q = useDebounced(search)
  const lessons = useResource('/lessons', { q, status: status === 'all' ? undefined : status, page, page_size: pageSize })

  return (
    <>
      <PageHeader
        title="Lessons"
        description={isAdmin ? 'Every version of every lesson. Published versions never change; edits go into a new draft.' : 'Published lessons you can assign to your children.'}
        actions={isAdmin ? <Button leadingIcon={RiAddLine} onClick={() => setCreating(true)}>New lesson</Button> : null}
      />
      <Panel
        bodyClassName="p-0"
        toolbar={(
          <>
            <Input size="small" className="max-w-64" aria-label="Search lessons" placeholder="Search lessons" leadingIcon={RiSearchLine} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
            {isAdmin ? <SelectField size="sm" className="w-44" options={STATUS_OPTIONS} value={status} onChange={(value) => { setStatus(value); setPage(1) }} /> : null}
          </>
        )}
        footer={<ListFooter data={lessons.data} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} noun="lesson versions" />}
      >
        <DataState loading={lessons.loading && !lessons.data} error={lessons.error} onRetry={lessons.reload}>
          {lessons.data?.items.length ? (
            <Table aria-label="Lessons" onRowAction={(id) => navigate(`/lessons/${id}`)}>
              <TableHeader>
                <TableColumn isRowHeader>Lesson</TableColumn>
                <TableColumn>Version</TableColumn>
                <TableColumn>Steps</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Published</TableColumn>
              </TableHeader>
              <TableBody items={lessons.data.items}>
                {(lesson) => (
                  <TableRow id={lesson.id} className="cursor-pointer">
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="text-body-medium text-text-primary">{lesson.title}</span>
                        <span className="text-caption-1-medium text-text-tertiary">{lesson.slug}</span>
                      </span>
                    </TableCell>
                    <TableCell>v{lesson.version}</TableCell>
                    <TableCell>{lesson.step_count}</TableCell>
                    <TableCell><StatusChip value={lesson.status} /></TableCell>
                    <TableCell>{formatDate(lesson.published_at)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={RiBookOpenLine} title="No lessons found" description={isAdmin ? 'Create the first lesson to get started.' : 'No lessons have been published yet.'} />
          )}
        </DataState>
      </Panel>
      {creating ? <NewLessonModal isOpen={creating} onOpenChange={setCreating} /> : null}
    </>
  )
}

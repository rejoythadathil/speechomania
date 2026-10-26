import { RiAddLine, RiSearchLine, RiUserHeartLine } from '@remixicon/react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Avatar } from '@/components/base/avatar/avatar'
import { Button } from '@/components/base/buttons/button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Input } from '@/components/base/input/input'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/base/table/table'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { age, formatDate, initials } from '@/utils/format'
import { ChildFormModal } from './child-form.jsx'

const STATUS_OPTIONS = [{ id: 'all', label: 'All statuses' }, { id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }]

export function ChildrenView() {
  const [params] = useSearchParams()
  return <ChildrenList key={params.get('q') ?? ''} />
}

function ChildrenList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const notify = useToast()
  const { page, pageSize, setPage, setPageSize, setParam, params } = usePageParams(20)
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)
  const unassigned = params.get('unassigned') === '1'
  const q = useDebounced(search)
  const children = useResource('/children', {
    q,
    status: status === 'all' ? undefined : status,
    unassigned: unassigned || undefined,
    page,
    page_size: pageSize
  })
  const canAdd = user.role === 'admin' || user.role === 'parent'

  return (
    <>
      <PageHeader
        title={user.role === 'admin' ? 'Children' : 'My children'}
        description={user.role === 'admin' ? 'Every child enrolled with Speechomania, their parent and their mentor.' : undefined}
        actions={canAdd ? <Button leadingIcon={RiAddLine} onClick={() => setAdding(true)}>Add child</Button> : null}
      />
      <Panel
        bodyClassName="p-0"
        toolbar={(
          <>
            <Input size="small" className="max-w-64" aria-label="Search children" placeholder="Search by name" leadingIcon={RiSearchLine} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
            {user.role === 'admin' ? (
              <>
                <SelectField size="sm" className="w-44" options={STATUS_OPTIONS} value={status} onChange={(value) => { setStatus(value); setPage(1) }} />
                <Checkbox isSelected={unassigned} onChange={(value) => setParam('unassigned', value ? '1' : null)}>Waiting for a mentor</Checkbox>
              </>
            ) : null}
          </>
        )}
        footer={<ListFooter data={children.data} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} noun="children" />}
      >
        <DataState loading={children.loading && !children.data} error={children.error} onRetry={children.reload}>
          {children.data?.items.length ? (
            <Table aria-label="Children" onRowAction={(id) => navigate(`/children/${id}`)}>
              <TableHeader>
                <TableColumn isRowHeader>Name</TableColumn>
                {user.role !== 'parent' ? <TableColumn>Parent</TableColumn> : null}
                {user.role !== 'mentor' ? <TableColumn>Mentor</TableColumn> : null}
                <TableColumn>Lessons</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Added</TableColumn>
              </TableHeader>
              <TableBody items={children.data.items}>
                {(child) => (
                  <TableRow id={child.id} className="cursor-pointer">
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar size="sm" color="blue" initials={initials(child.display_name)} />
                        <span className="flex flex-col">
                          <span className="text-body-medium text-text-primary">{child.display_name}</span>
                          {age(child.date_of_birth) !== null ? <span className="text-caption-1-medium text-text-tertiary">{age(child.date_of_birth)} years</span> : null}
                        </span>
                      </span>
                    </TableCell>
                    {user.role !== 'parent' ? <TableCell>{child.parent_name}</TableCell> : null}
                    {user.role !== 'mentor' ? <TableCell>{child.mentor_name ?? <span className="text-text-tertiary">Not assigned</span>}</TableCell> : null}
                    <TableCell>{child.assigned_lessons.length}</TableCell>
                    <TableCell><StatusChip value={child.status} /></TableCell>
                    <TableCell>{formatDate(child.created_at)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={RiUserHeartLine}
              title={q || unassigned ? 'No children match' : 'No children yet'}
              description={user.role === 'mentor' ? 'Children assigned to you by Speechomania will appear here.' : 'Add a child to get started.'}
            />
          )}
        </DataState>
      </Panel>
      {adding ? (
        <ChildFormModal
          isOpen={adding}
          onOpenChange={setAdding}
          onSaved={(child) => {
            notify(`${child.display_name} was added`)
            navigate(`/children/${child.id}`)
          }}
        />
      ) : null}
    </>
  )
}

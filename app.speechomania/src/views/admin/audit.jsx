import { RiFileListLine } from '@remixicon/react'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/base/table/table'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { formatDateTime, titleCase } from '@/utils/format'

const ENTITY_OPTIONS = [
  { id: 'all', label: 'Everything' },
  { id: 'child', label: 'Children' },
  { id: 'user', label: 'People' },
  { id: 'lesson', label: 'Lessons' },
  { id: 'remark', label: 'Remarks' },
  { id: 'change_request', label: 'Change requests' }
]

const describe = (action) => titleCase(action.split('.')[1] ?? action)

export function AuditView() {
  const [entity, setEntity] = useState('all')
  const { page, pageSize, setPage, setPageSize } = usePageParams(50)
  const audit = useResource('/audit', { entity_type: entity === 'all' ? undefined : entity, page, page_size: pageSize })

  return (
    <>
      <PageHeader title="Audit log" description="Every change, and every time someone opened a child’s record. Entries cannot be edited or deleted." />
      <Panel
        bodyClassName="p-0"
        toolbar={(
          <>
            <SelectField size="sm" className="w-52" options={ENTITY_OPTIONS} value={entity} onChange={(value) => { setEntity(value); setPage(1) }} />
          </>
        )}
        footer={<ListFooter data={audit.data} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} noun="events" />}
      >
        <DataState loading={audit.loading && !audit.data} error={audit.error} onRetry={audit.reload}>
          {audit.data?.items.length ? (
            <Table aria-label="Audit log" size="sm">
              <TableHeader>
                <TableColumn isRowHeader>When</TableColumn>
                <TableColumn>Who</TableColumn>
                <TableColumn>What</TableColumn>
                <TableColumn>Record</TableColumn>
                <TableColumn>IP address</TableColumn>
              </TableHeader>
              <TableBody items={audit.data.items}>
                {(entry) => (
                  <TableRow id={entry.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(entry.created_at)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {entry.actor_name ?? 'System'}
                        {entry.actor_role ? <StatusChip value={entry.actor_role} /> : null}
                      </span>
                    </TableCell>
                    <TableCell>{describe(entry.action)}</TableCell>
                    <TableCell><span className="text-text-secondary">{titleCase(entry.entity_type)}</span> <code className="text-caption-1-medium text-text-tertiary">{entry.entity_id.slice(-8)}</code></TableCell>
                    <TableCell className="text-text-tertiary">{entry.ip ?? '—'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={RiFileListLine} title="No entries" description="Actions will be recorded here as people use the platform." />
          )}
        </DataState>
      </Panel>
    </>
  )
}

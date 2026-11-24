import { RiArchiveDrawerLine, RiArrowGoBackLine } from '@remixicon/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@/components/base/table/table'
import { Tab, TabList, Tabs } from '@/components/base/tabs/tabs'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { usePageParams } from '@/hooks/use-page-params.js'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { formatDate } from '@/utils/format'

const TYPES = [
  { id: 'children', label: 'Children' },
  { id: 'people', label: 'People' },
  { id: 'notes', label: 'Notes' },
  { id: 'lessons', label: 'Lesson drafts' },
  { id: 'assessments', label: 'Assessment drafts' }
]

const countdown = (days) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`)

export function BackupView() {
  const notify = useToast()
  const [type, setType] = useState('children')
  const [restoring, setRestoring] = useState(null)
  const { page, pageSize, setPage, setPageSize } = usePageParams(25)
  const summary = useResource('/backup')
  const items = useResource(`/backup/${type}`, { page, page_size: pageSize })
  const days = summary.data?.retention_days

  async function restore(item) {
    setRestoring(item.id)
    try {
      await api(`/backup/${type}/${item.id}/restore`, { method: 'POST' })
      notify(`${item.title} was restored`)
      items.reload()
      summary.reload()
    } catch (error) {
      notify(error.message, { status: 'error' })
    } finally {
      setRestoring(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Backup"
        description={
          days ? (
            <>
              Everything deleted waits here for {days} days, then it is deleted for good. Change the
              period in{' '}
              <Link to="/settings" className="text-accent-700 underline">
                Settings
              </Link>
              .
            </>
          ) : (
            'Everything deleted waits here, then it is deleted for good.'
          )
        }
      />
      <Tabs
        selectedKey={type}
        onSelectionChange={(key) => {
          setType(key)
          setPage(1)
        }}
      >
        <TabList aria-label="Deleted items by kind">
          {TYPES.map((kind) => (
            <Tab key={kind.id} id={kind.id}>
              {kind.label}
              {summary.data ? ` (${summary.data.counts[kind.id]})` : ''}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <Panel
        bodyClassName="p-0"
        footer={
          <ListFooter
            data={items.data}
            page={page}
            onPage={setPage}
            pageSize={pageSize}
            onPageSize={setPageSize}
            noun="items"
          />
        }
      >
        <DataState
          loading={items.loading && !items.data}
          error={items.error}
          onRetry={items.reload}
        >
          {items.data?.items.length ? (
            <Table aria-label="Deleted items" size="sm">
              <TableHeader>
                <TableColumn isRowHeader>Item</TableColumn>
                <TableColumn>Deleted</TableColumn>
                <TableColumn>Deleted for good</TableColumn>
                <TableColumn> </TableColumn>
              </TableHeader>
              <TableBody items={items.data.items}>
                {(item) => (
                  <TableRow id={item.id}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="text-text-primary">{item.title}</span>
                        <span className="text-caption-1-medium text-text-tertiary">
                          {item.detail}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex flex-col">
                        {formatDate(item.deleted_at)}
                        <span className="text-caption-1-medium text-text-tertiary">
                          {item.deleted_by ? `by ${item.deleted_by}` : '—'}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex flex-col">
                        <span className={item.days_left <= 7 ? 'text-[#c8483d]' : undefined}>
                          {countdown(item.days_left)}
                        </span>
                        <span className="text-caption-1-medium text-text-tertiary">
                          {formatDate(item.purge_on)}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="small"
                        leadingIcon={RiArrowGoBackLine}
                        onClick={() => restore(item)}
                        disabled={restoring === item.id}
                      >
                        {restoring === item.id ? 'Restoring…' : 'Restore'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={RiArchiveDrawerLine}
              title="Nothing here"
              description="Deleted items of this kind will wait here until they can be restored or are deleted for good."
            />
          )}
        </DataState>
      </Panel>
    </>
  )
}

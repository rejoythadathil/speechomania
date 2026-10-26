import { RiBookOpenLine, RiChat3Line, RiEditBoxLine, RiUserHeartLine, RiUserUnfollowLine } from '@remixicon/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/base/avatar/avatar'
import { Button } from '@/components/base/buttons/button'
import { ChartPanel } from '@/components/shared/charts/chart-panel.jsx'
import { ColumnChart } from '@/components/shared/charts/column-chart.jsx'
import { StackedBars } from '@/components/shared/charts/stacked-bars.jsx'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { KpiTile } from '@/components/shared/kpi-tile.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { RouterButton } from '@/components/shared/router-button.jsx'
import { StatStrip } from '@/components/shared/stat-card.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { age, formatDateTime, initials } from '@/utils/format'

const monthShort = new Intl.DateTimeFormat('en-IN', { month: 'short' })
const monthLong = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const weekShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

const REASON = {
  no_mentor: { icon: RiUserUnfollowLine, text: () => 'No mentor' },
  no_recent_remark: { icon: RiChat3Line, text: (days) => `No remark for ${days} days` },
  never_remarked: { icon: RiChat3Line, text: (days) => `No remark in ${days} days since joining` },
  no_lessons: { icon: RiBookOpenLine, text: () => 'No lessons assigned' }
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function Kpis({ data, role }) {
  const k = data.kpis
  return (
    <StatStrip className="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 [&>*:last-child]:col-span-1">
      <KpiTile label={role === 'admin' ? 'Active children' : 'My children'} icon={RiUserHeartLine} value={k.children} note={`${data.follow_up_total} need follow-up`} to="/children" />
      {role === 'admin' ? (
        <KpiTile label="Waiting for a mentor" icon={RiUserUnfollowLine} value={k.waiting_for_mentor} note="Assign one so lessons can start" to="/children?unassigned=1" attention />
      ) : (
        <KpiTile label="No lessons assigned" icon={RiBookOpenLine} value={k.no_lessons} note="Assign lessons from the child's page" attention />
      )}
      <KpiTile label="Need a remark" icon={RiChat3Line} value={k.needs_remark} note={`No remark in ${data.stale_days}+ days`} attention />
      <KpiTile label={role === 'admin' ? 'Change requests' : 'My change requests'} icon={RiEditBoxLine} value={k.pending_requests} note={role === 'admin' ? 'Waiting for your review' : 'Waiting for admin review'} to="/change-requests" />
    </StatStrip>
  )
}

function ReasonChip({ reason }) {
  const { icon: Icon, text } = REASON[reason.code]
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--viz-warn-soft)] px-1.5 py-0.5 text-caption-1-medium whitespace-nowrap text-text-primary">
      <Icon className="size-3.5 text-[var(--viz-warn)]" aria-hidden />
      {text(reason.days)}
    </span>
  )
}

function FollowUp() {
  const [page, setPage] = useState(1)
  const result = useResource('/dashboard/follow-up', { page, page_size: 8 })
  const followUp = result.data
  return (
    <Panel
      title="Needs follow-up"
      description={followUp ? (followUp.total ? `${followUp.total} ${followUp.total === 1 ? 'child' : 'children'} · most urgent first` : 'Every child is on track') : undefined}
      actions={<RouterButton to="/children" variant="secondary" size="xs">All children</RouterButton>}
      footer={<ListFooter data={followUp} page={page} onPage={setPage} noun="children" />}
      bodyClassName="p-0"
    >
      <DataState loading={result.loading && !followUp} error={result.error} onRetry={result.reload}>
      {followUp?.items.length ? (
        <ul className="hairlines flex flex-col">
          {followUp.items.map((child) => (
            <li key={child.id}>
              <Link to={`/children/${child.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)]">
                <Avatar size="sm" color="blue" initials={initials(child.display_name)} />
                <span className="flex min-w-32 flex-1 flex-col">
                  <span className="text-body-2-semibold text-text-primary">{child.display_name}</span>
                  <span className="truncate text-caption-1-medium text-text-tertiary">{child.mentor_name ?? 'No mentor yet'}</span>
                </span>
                <span className="flex flex-wrap gap-1">{child.reasons.map((reason) => <ReasonChip key={reason.code} reason={reason} />)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={RiUserHeartLine} title="All caught up" description="Children without a mentor, lessons or a recent remark show up here." />}
      </DataState>
    </Panel>
  )
}

function CaseloadPanel({ caseload, staleDays }) {
  const series = [
    { key: 'recent', label: `Remark in last ${staleDays} days`, color: 'var(--viz-blue)' },
    { key: 'overdue', label: 'Overdue for a remark', color: 'var(--viz-warn)' }
  ]
  return (
    <Panel title="Mentor caseload" description="Children per mentor, split by remark status" actions={<RouterButton to="/people/mentor" variant="secondary" size="xs">Mentors</RouterButton>}>
      {caseload.length ? (
        <StackedBars
          rows={caseload.map((mentor) => ({ key: mentor.id, label: mentor.name, values: { recent: mentor.recent, overdue: mentor.overdue } }))}
          series={series}
          unit="children"
          ariaLabel="Children per mentor, split into recently remarked and overdue"
        />
      ) : <EmptyState icon={RiUserHeartLine} title="No mentors yet" />}
    </Panel>
  )
}

function RemarksPanel({ series, role }) {
  const data = series.map((week) => ({ key: week.week, label: weekShort.format(new Date(week.week)), detail: `week of ${weekShort.format(new Date(week.week))}`, values: { shared: week.shared, internal: week.internal } }))
  const shared = series.reduce((sum, week) => sum + week.shared, 0)
  const total = shared + series.reduce((sum, week) => sum + week.internal, 0)
  return (
    <ChartPanel
      title={role === 'admin' ? 'Remarks per week' : 'My remarks per week'}
      description="Last 12 weeks · the current week is still in progress"
      headline={<><span className="text-title-2-semibold text-text-primary">{total ? Math.round((shared / total) * 100) : 0}%</span><span className="text-body-2-regular text-text-tertiary">of {total} remarks were shared with parents</span></>}
      table={{ columns: ['Week of', 'Shared', 'Internal', 'Total'], rows: series.map((week) => [weekShort.format(new Date(week.week)), week.shared, week.internal, week.shared + week.internal]) }}
    >
      <ColumnChart
        data={data}
        series={[{ key: 'shared', label: 'Shared with parents', color: 'var(--viz-blue)' }, { key: 'internal', label: 'Internal', color: 'var(--viz-violet)' }]}
        unit="remarks"
        height={180}
        ariaLabel={`Remarks per week for 12 weeks, ${shared} of ${total} shared with parents.`}
      />
    </ChartPanel>
  )
}

function EnrolmentsPanel({ series }) {
  const total = series.reduce((sum, month) => sum + month.count, 0)
  const data = series.map((month) => {
    const date = new Date(`${month.month}-01`)
    return { key: month.month, label: monthShort.format(date).slice(0, 3), detail: monthLong.format(date), values: { count: month.count } }
  })
  return (
    <ChartPanel
      title="Enrolments"
      description="New children per month"
      headline={<><span className="text-title-2-semibold text-text-primary">{total}</span><span className="text-body-2-regular text-text-tertiary">children joined in the last 12 months</span></>}
      table={{ columns: ['Month', 'New children'], rows: data.map((point) => [point.detail, point.values.count]) }}
    >
      <ColumnChart data={data} series={[{ key: 'count', label: 'New children', color: 'var(--viz-blue)' }]} unit="new children" height={180} ariaLabel={`New children per month. ${data.map((point) => `${point.detail}: ${point.values.count}`).join(', ')}`} />
    </ChartPanel>
  )
}

function UnreadRemarks() {
  const notify = useToast()
  const [page, setPage] = useState(1)
  const remarks = useResource('/remarks/unread', { page, page_size: 6 })
  async function markSeen(id) {
    await api(`/remarks/${id}/seen`, { method: 'POST' })
    notify('Marked as read')
    remarks.reload()
  }
  return (
    <Panel
      title="New remarks"
      description={remarks.data ? `${remarks.data.total} unread` : undefined}
      footer={<ListFooter data={remarks.data} page={page} onPage={setPage} noun="unread" />}
      bodyClassName="p-0"
    >
      <DataState loading={remarks.loading && !remarks.data} error={remarks.error} onRetry={remarks.reload}>
        {remarks.data?.items.length ? (
          <ul className="hairlines flex flex-col">
            {remarks.data.items.map((remark) => (
              <li key={remark.id} className="flex items-start gap-2.5 px-3 py-2.5">
                <UserAvatar seed={remark.author_avatar} name={remark.author_name} size={28} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-2-semibold text-text-primary">
                    {remark.author_name} · <Link className="text-accent-700 hover:underline" to={`/children/${remark.child_id}`}>{remark.child_name}</Link>
                  </span>
                  <p className="line-clamp-2 text-caption-1-medium text-text-secondary">{remark.preview}</p>
                </div>
                <Button variant="secondary" size="xs" onClick={() => markSeen(remark.id)}>Read</Button>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={RiChat3Line} title="All caught up" description="New mentor remarks appear here." />}
      </DataState>
    </Panel>
  )
}

function PendingRequests() {
  const requests = useResource('/change-requests', { status: 'pending', page_size: 5 })
  return (
    <Panel title="Waiting for review" actions={<RouterButton to="/change-requests" variant="secondary" size="xs">Review</RouterButton>} bodyClassName="p-0">
      <DataState loading={requests.loading && !requests.data} error={requests.error} onRetry={requests.reload}>
        {requests.data?.items.length ? (
          <ul className="hairlines flex flex-col">
            {requests.data.items.map((request) => (
              <li key={request.id} className="flex flex-col gap-0.5 px-3 py-2.5">
                <span className="text-body-2-semibold text-text-primary">{request.lesson_title} · v{request.lesson_version}</span>
                <p className="line-clamp-2 text-caption-1-medium text-text-secondary">{request.proposed_change.summary}</p>
                <span className="text-caption-1-medium text-text-tertiary">{request.requested_by_name} · {formatDateTime(request.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={RiEditBoxLine} title="Nothing waiting" description="Lesson change requests appear here." />}
      </DataState>
    </Panel>
  )
}

function MyChildren() {
  const children = useResource('/children', { page_size: 6 })
  return (
    <Panel title="My children" actions={<RouterButton to="/children" variant="secondary" size="xs">View all</RouterButton>}>
      <DataState loading={children.loading && !children.data} error={children.error} onRetry={children.reload}>
        {children.data?.items.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {children.data.items.map((child) => (
              <li key={child.id}>
                <Link to={`/children/${child.id}`} className="surface surface-interactive flex items-center gap-3 p-2.5 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
                  <Avatar size="md" color="blue" initials={initials(child.display_name)} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-2-semibold text-text-primary">{child.display_name}</span>
                    <span className="truncate text-caption-1-medium text-text-tertiary">
                      {age(child.date_of_birth) !== null ? `${age(child.date_of_birth)} years · ` : ''}{child.mentor_name ? `Mentor: ${child.mentor_name}` : `${child.assigned_lessons.length} lessons`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={RiUserHeartLine} title="No children yet" description="Children linked to your account appear here." />}
      </DataState>
    </Panel>
  )
}

export function DashboardView() {
  const { user } = useAuth()
  const stats = useResource('/dashboard')
  const data = stats.data
  const admin = user.role === 'admin'
  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        title={`${greeting()}, ${user.full_name.split(' ')[0]}`}
        description={user.role === 'parent' ? 'Here is how your children are doing at DCCD.' : 'Children who need you today, then how the centre is doing.'}
        large
      />
      <DataState loading={stats.loading && !data} error={stats.error} onRetry={stats.reload}>
        {data && user.role !== 'parent' ? (
          <>
            <Kpis data={data} role={user.role} />
            <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <FollowUp />
              {admin ? <CaseloadPanel caseload={data.caseload} staleDays={data.stale_days} /> : <RemarksPanel series={data.remarks_by_week} role={user.role} />}
            </div>
            {admin ? (
              <>
                <div className="grid items-stretch gap-2.5 lg:grid-cols-2">
                  <RemarksPanel series={data.remarks_by_week} role={user.role} />
                  <EnrolmentsPanel series={data.enrolments_by_month} />
                </div>
                <div className="grid items-start gap-2.5 lg:grid-cols-2">
                  <UnreadRemarks />
                  <PendingRequests />
                </div>
              </>
            ) : <MyChildren />}
          </>
        ) : null}
        {data && user.role === 'parent' ? <MyChildren /> : null}
      </DataState>
    </>
  )
}

import { RiClipboardLine, RiEyeLine } from '@remixicon/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { IconButton } from '@/components/base/buttons/icon-button'
import { DataState } from '@/components/shared/data-state.jsx'
import { EmptyState } from '@/components/shared/empty-state.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { formatDate } from '@/utils/format'
import { AttemptModal, ScoreText } from './assessment-results.jsx'

export function ChildAssessmentsPanel({ childId }) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const assessments = useResource(`/children/${childId}/assessments`, { page, page_size: 5 })
  const staff = user.role !== 'parent'

  return (
    <Panel
      title="Assessments"
      description={
        staff ? 'Assigned assessments and the latest score' : 'Check-ins your child has been given'
      }
      bodyClassName="p-0"
      footer={
        <ListFooter data={assessments.data} page={page} onPage={setPage} noun="assessments" />
      }
    >
      <DataState
        loading={assessments.loading && !assessments.data}
        error={assessments.error}
        onRetry={assessments.reload}
      >
        {assessments.data?.items.length ? (
          <ul className="hairlines flex flex-col">
            {assessments.data.items.map((row) => (
              <li
                key={row.assessment_id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  {staff ? (
                    <Link
                      to={`/assessments/${row.assessment_id}`}
                      className="text-body-medium text-text-primary hover:text-accent-700"
                    >
                      {row.title}
                    </Link>
                  ) : (
                    <span className="text-body-medium text-text-primary">{row.title}</span>
                  )}
                  <span className="text-caption-1-medium text-text-tertiary">
                    {row.question_count} questions
                    {row.due_on ? ` · due ${formatDate(row.due_on)}` : ''}
                  </span>
                  <span className="text-body-2-regular">
                    {row.score_hidden && row.status === 'completed' ? (
                      <span className="text-text-tertiary">
                        Finished. The score is kept for the mentor.
                      </span>
                    ) : (
                      <ScoreText latest={row.latest} />
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <StatusChip value={row.status} />
                  {row.latest && !row.score_hidden ? (
                    <IconButton
                      size="small"
                      icon={RiEyeLine}
                      aria-label={`See answers for ${row.title}`}
                      onClick={() => setViewing(row.latest.attempt_id)}
                    />
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={RiClipboardLine}
            title="No assessments yet"
            description={
              staff
                ? 'Assign one from the Assessments page.'
                : 'Their mentor will share check-ins here.'
            }
          />
        )}
      </DataState>
      {viewing ? <AttemptModal attemptId={viewing} onClose={() => setViewing(null)} /> : null}
    </Panel>
  )
}

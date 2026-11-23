import { audit } from '../../../../../common-service/audit/service/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  limitExports,
  withRenderSlot,
  xlsxFile
} from '../../../../../common-service/reports/service/index.js'
import {
  ageOn,
  dateCell,
  everyRow,
  reportFileName,
  sheetOf,
  wordsOf
} from '../../../../../common-service/reports/utils/index.js'
import { getAssessment, listResults, resultSummary } from '../../assessments/service/index.js'
import { listChildren } from '../../children/service/index.js'

async function logExport(user, kind, entityId, rows, filters, ctx) {
  await audit(db, {
    actor: user,
    action: `export.${kind}`,
    entityType: 'export',
    entityId,
    diff: { rows, filters },
    ctx
  })
}

export async function childrenWorkbook(user, filters, ctx) {
  await limitExports(user)
  const children = await everyRow((page, size) =>
    listChildren(user, { ...filters, page, page_size: size })
  )
  const columns = [
    { label: 'Name', width: 26, value: (child) => child.display_name },
    { label: 'Age', width: 8, value: (child) => ageOn(child.date_of_birth) },
    { label: 'Parent', width: 24, value: (child) => child.parent_name },
    ...(user.role === 'admin'
      ? [{ label: 'Mentor', width: 24, value: (child) => child.mentor_name ?? 'Not assigned' }]
      : []),
    { label: 'Lessons assigned', width: 16, value: (child) => child.assigned_lessons.length },
    { label: 'Status', width: 12, value: (child) => wordsOf(child.status) },
    { label: 'Added', width: 14, value: (child) => dateCell(child.created_at) }
  ]
  const body = await withRenderSlot(() => xlsxFile([sheetOf('Children', columns, children)]))
  await logExport(user, 'children', user.id, children.length, filters, ctx)
  return {
    body,
    fileName: reportFileName(user.role === 'admin' ? 'children' : 'my-children', [
      filters.status,
      filters.unassigned && 'waiting-for-mentor',
      filters.q && `search-${filters.q}`
    ])
  }
}

export async function resultsWorkbook(user, id, filters, ctx) {
  await limitExports(user)
  const assessment = await getAssessment(user, id)
  const [rows, summary] = await Promise.all([
    everyRow((page, size) => listResults(user, id, { ...filters, page, page_size: size })),
    resultSummary(user, id)
  ])
  const hidden = (row) => row.latest && row.latest.score === undefined
  const children = [
    { label: 'Child', width: 26, value: (row) => row.display_name },
    { label: 'Mentor', width: 24, value: (row) => row.mentor_name ?? 'No mentor' },
    { label: 'Status', width: 14, value: (row) => wordsOf(row.status) },
    { label: 'Score', width: 10, value: (row) => (hidden(row) ? 'Hidden' : row.latest?.score) },
    { label: 'Out of', width: 10, value: (row) => (hidden(row) ? null : row.latest?.max_score) },
    { label: 'Percent', width: 10, value: (row) => (hidden(row) ? null : row.latest?.percent) },
    {
      label: 'Passed',
      width: 10,
      value: (row) =>
        row.latest?.passed === true ? 'Yes' : row.latest?.passed === false ? 'No' : null
    },
    { label: 'Attempts', width: 10, value: (row) => row.attempts },
    { label: 'Due', width: 14, value: (row) => dateCell(row.due_on) }
  ]
  const questions = [
    { label: 'No.', width: 6, value: (question) => question.index + 1 },
    { label: 'Question', width: 44, value: (question) => question.text },
    { label: 'From lesson', width: 30, value: (question) => question.lesson_title },
    { label: 'Right first time (%)', width: 18, value: (question) => question.accuracy },
    { label: 'Answered', width: 10, value: (question) => question.answered }
  ]
  const body = await withRenderSlot(() =>
    xlsxFile([
      sheetOf('Children', children, rows),
      sheetOf('Questions', questions, summary.questions ?? [])
    ])
  )
  await logExport(user, 'assessment_results', id, rows.length, filters, ctx)
  return {
    body,
    fileName: reportFileName('assessment-results', [
      assessment.title,
      filters.status?.replace('_', '-'),
      filters.q && `search-${filters.q}`
    ])
  }
}

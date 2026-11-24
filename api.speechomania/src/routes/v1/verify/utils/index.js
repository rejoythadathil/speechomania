import { REPORT_KINDS } from '../../../../../common-service/reports/constants/index.js'
import { longDate } from '../../../../../common-service/reports/utils/index.js'

export const issuedSummary = (row) => ({
  code: row.diff.code,
  kind: REPORT_KINDS[row.diff.kind] ?? 'Document',
  issued_on: longDate(row.created_at)
})

export function verdict({ match, issued, code }) {
  if (match) return { status: 'genuine', ...issuedSummary(match) }
  if (issued) return { status: 'changed', ...issuedSummary(issued) }
  return { status: 'unknown', code: code || null }
}

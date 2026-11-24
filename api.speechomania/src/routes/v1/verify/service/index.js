import { audit } from '../../../../../common-service/audit/service/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { ISSUED_ACTION } from '../../../../../common-service/reports/constants/index.js'
import { issuedSummary, verdict } from '../utils/index.js'

const issuedBy = (key, value) =>
  db.audit_logs.findFirst({
    where: { action: ISSUED_ACTION, diff: { path: [key], equals: value } },
    select: { entity_id: true, created_at: true, diff: true }
  })

export async function checkCode(code) {
  const issued = await issuedBy('code', code)
  return issued ? { status: 'issued', ...issuedSummary(issued) } : verdict({ code })
}

export async function checkFile({ sha256, code }, ctx) {
  const match = await issuedBy('sha256', sha256)
  const issued = !match && code ? await issuedBy('code', code) : null
  const result = verdict({ match, issued, code })
  if (result.status === 'changed')
    await audit(db, {
      actor: null,
      action: 'report.flagged',
      entityType: 'child',
      entityId: issued.entity_id,
      diff: { code, sha256, kind: issued.diff.kind },
      ctx
    })
  return result
}

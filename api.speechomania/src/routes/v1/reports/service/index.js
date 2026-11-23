import { audit } from '../../../../../common-service/audit/service/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  limitExports,
  pdfFile,
  withRenderSlot
} from '../../../../../common-service/reports/service/index.js'
import progressTemplate from '../../../../../common-service/reports/templates/progress-report.json'
import {
  everyRow,
  fillTemplate,
  reportFileName
} from '../../../../../common-service/reports/utils/index.js'
import { listForChild as listAssessments } from '../../assessments/service/index.js'
import { getLearner, listShelf } from '../../learning/service/index.js'
import { listForChild as listRemarks } from '../../remarks/service/index.js'
import { progressData } from '../utils/index.js'

export async function progressDocument(user, childId) {
  const learner = await getLearner(user, childId)
  const [lessons, assessments, remarks] = await Promise.all([
    everyRow((page, size) => listShelf(user, childId, { show: 'all', page, page_size: size })),
    everyRow((page, size) => listAssessments(user, childId, { page, page_size: size })),
    listRemarks(user, childId, { page: 1, page_size: 20 }).then((page) => page.items)
  ])
  const data = progressData({
    learner,
    lessons,
    assessments,
    remarks,
    parentName: user.full_name,
    today: new Date()
  })
  return {
    definition: fillTemplate(progressTemplate, data),
    data,
    counts: { lessons: lessons.length, assessments: assessments.length, remarks: remarks.length },
    fileName: reportFileName('progress', [learner.display_name], 'pdf')
  }
}

export async function progressReport(user, childId, ctx) {
  const report = await progressDocument(user, childId)
  await limitExports(user)
  const body = await withRenderSlot(() =>
    pdfFile(report.definition, `Speechomania · ${report.data.watermark}`)
  )
  await audit(db, {
    actor: user,
    action: 'report.progress',
    entityType: 'child',
    entityId: childId,
    diff: report.counts,
    ctx
  })
  return { body, fileName: report.fileName }
}

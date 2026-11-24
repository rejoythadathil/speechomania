import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import { PDF_TYPE } from '../../../../../common-service/reports/constants/index.js'
import { fileResponse } from '../../../../../common-service/reports/service/index.js'
import * as service from '../service/index.js'

export const progress = async (c) =>
  fileResponse(c, {
    ...(await service.progressReport(c.get('user'), c.get('valid').params.id, requestCtx(c))),
    type: PDF_TYPE
  })

export const cards = async (c) => {
  const { id, lessonId } = c.get('valid').params
  return fileResponse(c, {
    ...(await service.lessonCards(c.get('user'), id, lessonId, requestCtx(c))),
    type: PDF_TYPE
  })
}

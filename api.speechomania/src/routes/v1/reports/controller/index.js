import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import { PDF_TYPE } from '../../../../../common-service/reports/constants/index.js'
import { fileResponse } from '../../../../../common-service/reports/service/index.js'
import * as service from '../service/index.js'

export const progress = async (c) =>
  fileResponse(c, {
    ...(await service.progressReport(c.get('user'), c.get('valid').params.id, requestCtx(c))),
    type: PDF_TYPE
  })

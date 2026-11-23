import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import { fileResponse } from '../../../../../common-service/reports/service/index.js'
import * as service from '../service/index.js'

export const children = async (c) =>
  fileResponse(
    c,
    await service.childrenWorkbook(c.get('user'), c.get('valid').query, requestCtx(c))
  )

export async function results(c) {
  const { params, query } = c.get('valid')
  return fileResponse(
    c,
    await service.resultsWorkbook(c.get('user'), params.id, query, requestCtx(c))
  )
}

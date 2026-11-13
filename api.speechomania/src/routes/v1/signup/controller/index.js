import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const create = async (c) =>
  c.json(await service.createFamily(c.get('google'), c.get('valid').body, requestCtx(c)), 201)

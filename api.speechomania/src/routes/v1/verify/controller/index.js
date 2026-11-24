import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const code = async (c) => c.json(await service.checkCode(c.get('valid').params.code))

export const file = async (c) => c.json(await service.checkFile(c.get('valid').body, requestCtx(c)))

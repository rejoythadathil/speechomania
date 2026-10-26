import { requestCtx } from '../../../../utils.js'
import * as service from './auth.service.js'

export const me = async (c) => c.json(await service.profile(c.get('user')))

export const update = async (c) => c.json(await service.updateProfile(c.get('user'), c.get('valid').body, requestCtx(c)))

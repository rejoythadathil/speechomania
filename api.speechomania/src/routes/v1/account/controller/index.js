import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const deletion = async (c) => c.json(await service.getDeletion(c.get('user')))

export const requestDeletion = async (c) =>
  c.json(await service.requestDeletion(c.get('user'), c.get('valid').body, requestCtx(c)), 201)

export const cancelDeletion = async (c) =>
  c.json(await service.cancelDeletion(c.get('user'), requestCtx(c)))

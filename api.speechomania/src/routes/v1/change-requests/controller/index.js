import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listRequests(c.get('user'), c.get('valid').query))

export const get = async (c) => c.json(await service.getRequest(c.get('user'), c.get('valid').params.id))

export const create = async (c) => c.json(await service.createRequest(c.get('user'), c.get('valid').body, requestCtx(c)), 201)

export async function review(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.reviewRequest(c.get('user'), params.id, body, requestCtx(c)))
}

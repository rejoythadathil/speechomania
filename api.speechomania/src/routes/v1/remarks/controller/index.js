import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listForChild(c.get('user'), c.get('valid').params.childId, c.get('valid').query))

export async function create(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.createRemark(c.get('user'), params.childId, body, requestCtx(c)), 201)
}

export async function update(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.updateRemark(c.get('user'), params.id, body, requestCtx(c)))
}

export async function remove(c) {
  await service.deleteRemark(c.get('user'), c.get('valid').params.id, requestCtx(c))
  return c.body(null, 204)
}

export const seen = async (c) => c.json(await service.markSeen(c.get('user'), c.get('valid').params.id))

export const unread = async (c) => c.json(await service.unread(c.get('valid').query))

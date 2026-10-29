import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listChildren(c.get('user'), c.get('valid').query))

export const get = async (c) => c.json(await service.getChild(c.get('user'), c.get('valid').params.id, requestCtx(c)))

export const create = async (c) => c.json(await service.createChild(c.get('user'), c.get('valid').body, requestCtx(c)), 201)

export async function update(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.updateChild(c.get('user'), params.id, body, requestCtx(c)))
}

export async function setMentor(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.assignMentor(c.get('user'), params.id, body.mentor_id, requestCtx(c)))
}

export async function setLessons(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.assignLessons(c.get('user'), params.id, body.slugs, requestCtx(c)))
}

export async function remove(c) {
  await service.deleteChild(c.get('user'), c.get('valid').params.id, requestCtx(c))
  return c.body(null, 204)
}

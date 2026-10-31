import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listLessons(c.get('user'), c.get('valid').query))

export const get = async (c) => c.json(await service.getLesson(c.get('user'), c.get('valid').params.id))

export const versions = async (c) => c.json(await service.listVersions(c.get('user'), c.get('valid').params.id, c.get('valid').query))

export const create = async (c) => c.json(await service.createLesson(c.get('user'), c.get('valid').body, requestCtx(c)), 201)

export async function update(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.updateLesson(c.get('user'), params.id, body, requestCtx(c)))
}

export const publish = async (c) => c.json(await service.publishLesson(c.get('user'), c.get('valid').params.id, requestCtx(c)))

export const draft = async (c) => c.json(await service.newVersion(c.get('user'), c.get('valid').params.id, requestCtx(c)), 201)

export async function remove(c) {
  await service.removeLesson(c.get('user'), c.get('valid').params.id, requestCtx(c))
  return c.body(null, 204)
}

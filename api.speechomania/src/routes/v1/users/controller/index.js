import { config } from '../../../../../config/index.js'
import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listUsers(c.get('valid').query))

export const get = async (c) => c.json(await service.getUser(c.get('valid').params.id))

export async function create(c) {
  const { user, inviteLink } = await service.createUser(c.get('user'), c.get('valid').body, requestCtx(c))
  return c.json({ user, invite_link: inviteLink, invite_link_is_local: config.APP_ENV === 'local' }, 201)
}

export async function update(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.updateUser(c.get('user'), params.id, body, requestCtx(c)))
}

export async function remove(c) {
  await service.deleteUser(c.get('user'), c.get('valid').params.id, requestCtx(c))
  return c.body(null, 204)
}

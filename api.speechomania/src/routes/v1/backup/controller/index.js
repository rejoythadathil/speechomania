import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const summary = async (c) => c.json(await service.summary())

export const list = async (c) => {
  const { params, query } = c.get('valid')
  return c.json(await service.listDeleted(params.type, query))
}

export const restore = async (c) => {
  const { type, id } = c.get('valid').params
  return c.json(await service.restore(c.get('user'), type, id, requestCtx(c)))
}

export const settings = async (c) => c.json({ retention_days: await service.retentionDays() })

export const updateSettings = async (c) =>
  c.json(await service.updateSettings(c.get('user'), c.get('valid').body, requestCtx(c)))

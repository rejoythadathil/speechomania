import * as service from '../service/index.js'

export const list = async (c) => c.json(await service.listAudit(c.get('valid').query))

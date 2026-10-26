import * as service from './audit.service.js'

export const list = async (c) => c.json(await service.listAudit(c.get('valid').query))

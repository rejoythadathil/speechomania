import * as service from '../service/index.js'

export const search = async (c) => c.json(await service.search(c.get('user'), c.get('valid').query.q))

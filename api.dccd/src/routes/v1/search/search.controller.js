import * as service from './search.service.js'

export const search = async (c) => c.json(await service.search(c.get('user'), c.get('valid').query.q))

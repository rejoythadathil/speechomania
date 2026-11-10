import * as service from '../service/index.js'

export const summary = async (c) => c.json(await service.summary())

export const games = async (c) => c.json(await service.games(c.get('valid').query))

import * as service from '../service/index.js'

export const get = async (c) => c.json(await service.summary(c.get('user')))

export const badges = async (c) => c.json(await service.badges(c.get('user')))

export const followUp = async (c) => c.json(await service.followUpPage(c.get('user'), c.get('valid').query))

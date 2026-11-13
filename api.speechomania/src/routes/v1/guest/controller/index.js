import { getGuestChild } from '../../learning/service/index.js'

export const child = async (c) => c.json(await getGuestChild())

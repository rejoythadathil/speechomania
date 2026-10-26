import { forbidden } from '../../utils.js'

export const allow = (...roles) => async (c, next) => {
  if (!roles.includes(c.get('user')?.role)) throw forbidden()
  await next()
}

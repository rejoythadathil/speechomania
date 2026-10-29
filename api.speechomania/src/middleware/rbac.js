import { forbidden } from '../../common-service/http/exception/index.js'

export const allow = (...roles) => async (c, next) => {
  if (!roles.includes(c.get('user')?.role)) throw forbidden()
  await next()
}

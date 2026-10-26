import { HttpError } from '../../utils.js'

async function readBody(c) {
  try {
    return await c.req.json()
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON')
  }
}

async function readPart(c, part) {
  if (part === 'params') return c.req.param()
  if (part === 'query') return c.req.query()
  return readBody(c)
}

export function validate(schemas) {
  return async (c, next) => {
    const valid = {}
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue
      const { value, error } = schemas[part].validate(await readPart(c, part), { abortEarly: false, convert: true })
      if (error) {
        const details = error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message.replaceAll('"', '') }))
        throw new HttpError(400, 'Some fields need attention', details)
      }
      valid[part] = value
    }
    c.set('valid', valid)
    await next()
  }
}

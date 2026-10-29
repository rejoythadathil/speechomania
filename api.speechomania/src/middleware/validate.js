import { invalidFields, invalidJson } from '../../common-service/http/exception/index.js'

async function readBody(c) {
  try {
    return await c.req.json()
  } catch {
    throw invalidJson()
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
        throw invalidFields(details)
      }
      valid[part] = value
    }
    c.set('valid', valid)
    await next()
  }
}

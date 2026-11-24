import { Hono } from 'hono'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { codeParams, fileBody } from '../validation/index.js'

export const verifyRoute = new Hono()
  .get('/:code', validate({ params: codeParams }), controller.code)
  .post('/', validate({ body: fileBody }), controller.file)

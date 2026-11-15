import { Hono } from 'hono'
import { requireNewGoogle } from '../../../../middleware/auth.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { signupBody } from '../validation/index.js'

export const signupRoute = new Hono()
  .use(requireNewGoogle)
  .post('/', validate({ body: signupBody }), controller.create)

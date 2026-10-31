import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { profileBody } from '../validation/index.js'

export const authRoute = new Hono()
  .get('/me', controller.me)
  .patch('/me', allow('admin', 'mentor'), validate({ body: profileBody }), controller.update)

import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { deletionBody } from '../validation/index.js'

export const accountRoute = new Hono()
  .use(allow('parent'))
  .get('/deletion', controller.deletion)
  .post('/deletion', validate({ body: deletionBody }), controller.requestDeletion)
  .delete('/deletion', controller.cancelDeletion)

import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { childParams } from '../validation/index.js'

export const reportsRoute = new Hono().get(
  '/children/:id/progress',
  allow('parent'),
  validate({ params: childParams }),
  controller.progress
)

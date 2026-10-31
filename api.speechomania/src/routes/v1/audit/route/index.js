import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { listQuery } from '../validation/index.js'

export const auditRoute = new Hono().get('/', allow('admin'), validate({ query: listQuery }), controller.list)

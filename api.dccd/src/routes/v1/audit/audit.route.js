import { Hono } from 'hono'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import * as controller from './audit.controller.js'
import { listQuery } from './audit.validation.js'

export const auditRoute = new Hono().get('/', allow('admin'), validate({ query: listQuery }), controller.list)

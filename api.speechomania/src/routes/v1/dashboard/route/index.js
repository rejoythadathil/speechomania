import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { followUpQuery } from '../validation/index.js'

export const dashboardRoute = new Hono()
  .get('/', controller.get)
  .get('/badges', controller.badges)
  .get('/follow-up', allow('admin', 'mentor'), validate({ query: followUpQuery }), controller.followUp)

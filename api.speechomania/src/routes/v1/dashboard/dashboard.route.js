import { Hono } from 'hono'
import Joi from 'joi'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import { pageQuery } from '../../../../utils.js'
import * as controller from './dashboard.controller.js'

export const dashboardRoute = new Hono()
  .get('/', controller.get)
  .get('/badges', controller.badges)
  .get('/follow-up', allow('admin', 'mentor'), validate({ query: Joi.object(pageQuery) }), controller.followUp)

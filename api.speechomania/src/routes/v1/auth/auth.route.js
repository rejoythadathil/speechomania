import { Hono } from 'hono'
import Joi from 'joi'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import * as controller from './auth.controller.js'

const profileBody = Joi.object({
  full_name: Joi.string().trim().min(1).max(120),
  phone: Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).allow(null, ''),
  avatar: Joi.string().pattern(/^[A-Za-z0-9-]{1,64}$/)
}).min(1)

export const authRoute = new Hono()
  .get('/me', controller.me)
  .patch('/me', allow('admin', 'mentor'), validate({ body: profileBody }), controller.update)

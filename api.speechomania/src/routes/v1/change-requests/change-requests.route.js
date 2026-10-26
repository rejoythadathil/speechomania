import { Hono } from 'hono'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import * as controller from './change-requests.controller.js'
import { createBody, idParams, listQuery, reviewBody } from './change-requests.validation.js'

export const changeRequestsRoute = new Hono()
  .use(allow('admin', 'mentor'))
  .get('/', validate({ query: listQuery }), controller.list)
  .post('/', allow('mentor'), validate({ body: createBody }), controller.create)
  .get('/:id', validate({ params: idParams }), controller.get)
  .post('/:id/review', allow('admin'), validate({ params: idParams, body: reviewBody }), controller.review)

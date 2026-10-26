import { Hono } from 'hono'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import * as controller from './users.controller.js'
import { createBody, idParams, listQuery, updateBody } from './users.validation.js'

export const usersRoute = new Hono()
  .use(allow('admin'))
  .get('/', validate({ query: listQuery }), controller.list)
  .post('/', validate({ body: createBody }), controller.create)
  .get('/:id', validate({ params: idParams }), controller.get)
  .patch('/:id', validate({ params: idParams, body: updateBody }), controller.update)
  .delete('/:id', validate({ params: idParams }), controller.remove)

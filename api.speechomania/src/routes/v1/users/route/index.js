import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { createBody, idParams, listQuery, updateBody } from '../validation/index.js'

export const usersRoute = new Hono()
  .use(allow('admin'))
  .get('/', validate({ query: listQuery }), controller.list)
  .post('/', validate({ body: createBody }), controller.create)
  .get('/:id', validate({ params: idParams }), controller.get)
  .patch('/:id', validate({ params: idParams, body: updateBody }), controller.update)
  .delete('/:id', validate({ params: idParams }), controller.remove)

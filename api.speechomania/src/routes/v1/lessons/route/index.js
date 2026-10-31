import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { createBody, idParams, listQuery, pageOnly, updateBody } from '../validation/index.js'

export const lessonsRoute = new Hono()
  .get('/', validate({ query: listQuery }), controller.list)
  .post('/', allow('admin'), validate({ body: createBody }), controller.create)
  .get('/:id', validate({ params: idParams }), controller.get)
  .get('/:id/versions', allow('admin'), validate({ params: idParams, query: pageOnly }), controller.versions)
  .patch('/:id', allow('admin'), validate({ params: idParams, body: updateBody }), controller.update)
  .post('/:id/publish', allow('admin'), validate({ params: idParams }), controller.publish)
  .post('/:id/draft', allow('admin'), validate({ params: idParams }), controller.draft)
  .delete('/:id', allow('admin'), validate({ params: idParams }), controller.remove)

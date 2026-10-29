import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { createBody, idParams, lessonsBody, listQuery, mentorBody, updateBody } from '../validation/index.js'

export const childrenRoute = new Hono()
  .get('/', validate({ query: listQuery }), controller.list)
  .post('/', allow('admin', 'parent'), validate({ body: createBody }), controller.create)
  .get('/:id', validate({ params: idParams }), controller.get)
  .patch('/:id', allow('admin', 'parent'), validate({ params: idParams, body: updateBody }), controller.update)
  .put('/:id/mentor', allow('admin'), validate({ params: idParams, body: mentorBody }), controller.setMentor)
  .put('/:id/lessons', allow('admin', 'mentor'), validate({ params: idParams, body: lessonsBody }), controller.setLessons)
  .delete('/:id', allow('admin'), validate({ params: idParams }), controller.remove)

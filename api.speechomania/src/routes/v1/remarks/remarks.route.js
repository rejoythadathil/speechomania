import { Hono } from 'hono'
import { allow } from '../../../middleware/rbac.js'
import { validate } from '../../../middleware/validate.js'
import * as controller from './remarks.controller.js'
import { childParams, createBody, idParams, pageOnly, updateBody } from './remarks.validation.js'

export const remarksRoute = new Hono()
  .get('/remarks/unread', allow('admin'), validate({ query: pageOnly }), controller.unread)
  .get('/children/:childId/remarks', validate({ params: childParams, query: pageOnly }), controller.list)
  .post('/children/:childId/remarks', allow('admin', 'mentor'), validate({ params: childParams, body: createBody }), controller.create)
  .patch('/remarks/:id', allow('admin', 'mentor'), validate({ params: idParams, body: updateBody }), controller.update)
  .delete('/remarks/:id', allow('admin', 'mentor'), validate({ params: idParams }), controller.remove)
  .post('/remarks/:id/seen', allow('admin'), validate({ params: idParams }), controller.seen)

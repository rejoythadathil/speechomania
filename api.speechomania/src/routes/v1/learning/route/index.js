import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { attemptParams, childParams, exitBody, lessonParams, progressBody, shelfQuery, startBody } from '../validation/index.js'

export const learningRoute = new Hono()
  .use(allow('parent'))
  .get('/children/:id', validate({ params: childParams }), controller.child)
  .get('/children/:id/lessons', validate({ params: childParams, query: shelfQuery }), controller.shelf)
  .get('/children/:id/lessons/:lessonId', validate({ params: lessonParams }), controller.lesson)
  .post('/children/:id/attempts', validate({ params: childParams, body: startBody }), controller.start)
  .post('/children/:id/exit', validate({ params: childParams, body: exitBody }), controller.exit)
  .patch('/attempts/:id', validate({ params: attemptParams, body: progressBody }), controller.progress)

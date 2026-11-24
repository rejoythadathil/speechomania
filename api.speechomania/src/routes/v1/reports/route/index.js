import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { childParams, lessonParams } from '../validation/index.js'

export const reportsRoute = new Hono()
  .use(allow('parent'))
  .get('/children/:id/progress', validate({ params: childParams }), controller.progress)
  .get(
    '/children/:id/lessons/:lessonId/cards',
    validate({ params: lessonParams }),
    controller.cards
  )

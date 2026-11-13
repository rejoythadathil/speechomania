import { Hono } from 'hono'
import { requireGuest } from '../../../../middleware/auth.js'
import { validate } from '../../../../middleware/validate.js'
import * as learning from '../../learning/controller/index.js'
import {
  assessmentParams,
  childParams,
  gamesQuery,
  lessonParams,
  shelfQuery
} from '../../learning/validation/index.js'
import * as controller from '../controller/index.js'

export const guestRoute = new Hono()
  .use(requireGuest)
  .get('/', controller.child)
  .get('/learning/children/:id', validate({ params: childParams }), learning.child)
  .get(
    '/learning/children/:id/lessons',
    validate({ params: childParams, query: gamesQuery }),
    learning.shelf
  )
  .get(
    '/learning/children/:id/lessons/:lessonId',
    validate({ params: lessonParams }),
    learning.lesson
  )
  .get(
    '/learning/children/:id/assessments',
    validate({ params: childParams, query: shelfQuery }),
    learning.assessments
  )
  .get(
    '/learning/children/:id/assessments/:assessmentId',
    validate({ params: assessmentParams }),
    learning.assessment
  )

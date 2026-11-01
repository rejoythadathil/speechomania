import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import {
  assignBody,
  assignmentParams,
  attemptParams,
  childParams,
  createBody,
  idParams,
  listQuery,
  pageOnly,
  resultsQuery,
  updateBody
} from '../validation/index.js'

const staff = allow('admin', 'mentor')
const admin = allow('admin')

export const assessmentsRoute = new Hono()
  .get(
    '/children/:childId/assessments',
    validate({ params: childParams, query: pageOnly }),
    controller.forChild
  )
  .get('/assessment-attempts/:attemptId', validate({ params: attemptParams }), controller.attempt)
  .get('/assessments', staff, validate({ query: listQuery }), controller.list)
  .post('/assessments', admin, validate({ body: createBody }), controller.create)
  .get('/assessments/:id', staff, validate({ params: idParams }), controller.get)
  .patch(
    '/assessments/:id',
    admin,
    validate({ params: idParams, body: updateBody }),
    controller.update
  )
  .post('/assessments/:id/publish', admin, validate({ params: idParams }), controller.publish)
  .delete('/assessments/:id', admin, validate({ params: idParams }), controller.remove)
  .post(
    '/assessments/:id/assignments',
    staff,
    validate({ params: idParams, body: assignBody }),
    controller.assign
  )
  .delete(
    '/assessments/:id/assignments/:childId',
    staff,
    validate({ params: assignmentParams }),
    controller.unassign
  )
  .get(
    '/assessments/:id/results',
    staff,
    validate({ params: idParams, query: resultsQuery }),
    controller.results
  )
  .get('/assessments/:id/summary', staff, validate({ params: idParams }), controller.summary)

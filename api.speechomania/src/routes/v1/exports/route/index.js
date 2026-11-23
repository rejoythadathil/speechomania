import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { childrenQuery, idParams, resultsQuery } from '../validation/index.js'

export const exportsRoute = new Hono()
  .use(allow('admin', 'mentor'))
  .get('/children', validate({ query: childrenQuery }), controller.children)
  .get(
    '/assessments/:id/results',
    validate({ params: idParams, query: resultsQuery }),
    controller.results
  )

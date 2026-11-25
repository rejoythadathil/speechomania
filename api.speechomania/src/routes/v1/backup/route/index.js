import { Hono } from 'hono'
import { allow } from '../../../../middleware/rbac.js'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { itemParams, listQuery, settingsBody, typeParams } from '../validation/index.js'

export const backupRoute = new Hono()
  .use(allow('admin'))
  .get('/', controller.summary)
  .get('/settings', controller.settings)
  .put('/settings', validate({ body: settingsBody }), controller.updateSettings)
  .get('/:type', validate({ params: typeParams, query: listQuery }), controller.list)
  .post('/:type/:id/restore', validate({ params: itemParams }), controller.restore)

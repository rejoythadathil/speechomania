import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import { auditRoute } from './audit/audit.route.js'
import { authRoute } from './auth/auth.route.js'
import { changeRequestsRoute } from './change-requests/change-requests.route.js'
import { childrenRoute } from './children/children.route.js'
import { dashboardRoute } from './dashboard/dashboard.route.js'
import { searchRoute } from './search/search.route.js'
import { lessonsRoute } from './lessons/lessons.route.js'
import { remarksRoute } from './remarks/remarks.route.js'
import { usersRoute } from './users/users.route.js'

export const v1 = new Hono()
  .use(requireAuth)
  .route('/auth', authRoute)
  .route('/dashboard', dashboardRoute)
  .route('/search', searchRoute)
  .route('/users', usersRoute)
  .route('/', remarksRoute)
  .route('/children', childrenRoute)
  .route('/lessons', lessonsRoute)
  .route('/change-requests', changeRequestsRoute)
  .route('/audit', auditRoute)

import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import { auditRoute } from './audit/route/index.js'
import { authRoute } from './auth/route/index.js'
import { changeRequestsRoute } from './change-requests/route/index.js'
import { childrenRoute } from './children/route/index.js'
import { dashboardRoute } from './dashboard/route/index.js'
import { searchRoute } from './search/route/index.js'
import { learningRoute } from './learning/route/index.js'
import { lessonsRoute } from './lessons/route/index.js'
import { remarksRoute } from './remarks/route/index.js'
import { usersRoute } from './users/route/index.js'

export const v1 = new Hono()
  .use(requireAuth)
  .route('/auth', authRoute)
  .route('/dashboard', dashboardRoute)
  .route('/search', searchRoute)
  .route('/users', usersRoute)
  .route('/', remarksRoute)
  .route('/children', childrenRoute)
  .route('/lessons', lessonsRoute)
  .route('/learning', learningRoute)
  .route('/change-requests', changeRequestsRoute)
  .route('/audit', auditRoute)

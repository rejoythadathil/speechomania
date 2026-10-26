import { Navigate, Outlet, createBrowserRouter } from 'react-router'
import { useAuth } from '@/hooks/use-auth.jsx'
import { WorkLayout } from '@/layout/work-layout/work-layout.jsx'
import { AuditView } from '@/views/admin/audit.jsx'
import { PeopleView } from '@/views/admin/people.jsx'
import { LoginView } from '@/views/auth/login.jsx'
import { ChangeRequestsView } from '@/views/shared/change-requests.jsx'
import { ChildDetailView } from '@/views/shared/child-detail.jsx'
import { ChildrenView } from '@/views/shared/children.jsx'
import { DashboardView } from '@/views/shared/dashboard.jsx'
import { LessonDetailView } from '@/views/shared/lesson-detail.jsx'
import { LessonsView } from '@/views/shared/lessons.jsx'
import { NotFoundView } from '@/views/shared/not-found.jsx'
import { SettingsView } from '@/views/shared/settings.jsx'

function RequireAuth() {
  const { status } = useAuth()
  if (status === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center text-body-regular text-text-secondary" aria-busy="true">Loading…</div>
  }
  if (status !== 'signed-in') return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireRole({ roles }) {
  const { user } = useAuth()
  if (!roles.includes(user.role)) return <NotFoundView />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginView /> },
  {
    element: <RequireAuth />,
    children: [{
      element: <WorkLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <DashboardView /> },
        { path: 'children', element: <ChildrenView /> },
        { path: 'children/:id', element: <ChildDetailView /> },
        {
          element: <RequireRole roles={['admin', 'mentor']} />,
          children: [
            { path: 'lessons', element: <LessonsView /> },
            { path: 'lessons/:id', element: <LessonDetailView /> },
            { path: 'change-requests', element: <ChangeRequestsView /> },
            { path: 'settings', element: <SettingsView /> }
          ]
        },
        {
          element: <RequireRole roles={['admin']} />,
          children: [
            { path: 'people/:role', element: <PeopleView /> },
            { path: 'audit', element: <AuditView /> }
          ]
        },
        { path: '*', element: <NotFoundView /> }
      ]
    }]
  }
])

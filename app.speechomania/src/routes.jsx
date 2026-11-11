import { Navigate, Outlet, createBrowserRouter } from 'react-router'
import { useAuth } from '@/hooks/use-auth.jsx'
import { LearningLayout } from '@/layout/learning-layout/learning-layout.jsx'
import { WorkLayout } from '@/layout/work-layout/work-layout.jsx'
import { AuditView } from '@/views/admin/audit.jsx'
import { PeopleView } from '@/views/admin/people.jsx'
import { LoginView } from '@/views/auth/login.jsx'
import { AssessmentPlayerView } from '@/views/child/assessment-player.jsx'
import { LearnHomeView } from '@/views/child/learn-home.jsx'
import { LearnStartView } from '@/views/child/learn-start.jsx'
import { LessonPlayerView } from '@/views/child/lesson-player.jsx'
import { AssessmentDetailView } from '@/views/shared/assessment-detail.jsx'
import { AssessmentsView } from '@/views/shared/assessments.jsx'
import { ChangeRequestsView } from '@/views/shared/change-requests.jsx'
import { ChildDetailView } from '@/views/shared/child-detail.jsx'
import { ChildrenView } from '@/views/shared/children.jsx'
import { DashboardView } from '@/views/shared/dashboard.jsx'
import { LessonDetailView } from '@/views/shared/lesson-detail.jsx'
import { LessonsView } from '@/views/shared/lessons.jsx'
import { LandingView } from '@/views/public/landing.jsx'
import { StartView } from '@/views/public/start.jsx'
import { TryView } from '@/views/public/try.jsx'
import { NotFoundView } from '@/views/shared/not-found.jsx'
import { SettingsView } from '@/views/shared/settings.jsx'

function Loading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center text-body-regular text-text-secondary"
      aria-busy="true"
    >
      Loading…
    </div>
  )
}

function RequireAuth() {
  const { status } = useAuth()
  if (status === 'loading') return <Loading />
  if (status !== 'signed-in') return <Navigate to="/login" replace />
  return <Outlet />
}

function Front() {
  const { status, user } = useAuth()
  if (status === 'loading') return <Loading />
  if (status === 'signed-in')
    return <Navigate to={user.role === 'parent' ? '/learn' : '/dashboard'} replace />
  return <LandingView />
}

function RequireRole({ roles }) {
  const { user } = useAuth()
  if (!roles.includes(user.role)) return <NotFoundView />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <Front /> },
  { path: '/try', element: <TryView /> },
  { path: '/start', element: <StartView /> },
  { path: '/login', element: <LoginView /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={['parent']} />,
        children: [
          { path: 'learn', element: <LearnStartView /> },
          {
            path: 'learn/:childId',
            element: <LearningLayout />,
            children: [
              { index: true, element: <LearnHomeView /> },
              { path: 'lessons/:lessonId', element: <LessonPlayerView /> },
              { path: 'assessments/:assessmentId', element: <AssessmentPlayerView /> }
            ]
          }
        ]
      },
      {
        element: <WorkLayout />,
        children: [
          { path: 'dashboard', element: <DashboardView /> },
          { path: 'children', element: <ChildrenView /> },
          { path: 'children/:id', element: <ChildDetailView /> },
          { path: 'lessons/:id', element: <LessonDetailView /> },
          {
            element: <RequireRole roles={['admin', 'mentor']} />,
            children: [
              { path: 'lessons', element: <LessonsView /> },
              { path: 'assessments', element: <AssessmentsView /> },
              { path: 'assessments/:id', element: <AssessmentDetailView /> },
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
      }
    ]
  }
])

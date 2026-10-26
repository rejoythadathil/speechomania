import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { DirectionProvider } from '@/components/foundations/direction/direction'
import { ToastProvider } from '@/components/shared/toast.jsx'
import { AuthProvider } from '@/hooks/use-auth.jsx'
import { router } from './routes.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <DirectionProvider locale="en-IN">
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </DirectionProvider>
    </MotionConfig>
  </StrictMode>
)

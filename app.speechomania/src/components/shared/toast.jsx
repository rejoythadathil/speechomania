import { createContext, use, useCallback, useMemo, useState } from 'react'
import { Notification, NotificationViewport } from '@/components/base/notification/notification'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((title, { status = 'success', description } = {}) => {
    setToasts((current) => [...current, { id: crypto.randomUUID(), title, status, description }])
  }, [])

  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext value={value}>
      {children}
      <NotificationViewport position="bottom-end">
        {toasts.map((toast) => (
          <Notification
            key={toast.id}
            title={toast.title}
            description={toast.description}
            status={toast.status}
            autoDismissDuration={4500}
            onDismiss={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          />
        ))}
      </NotificationViewport>
    </ToastContext>
  )
}

export const useToast = () => use(ToastContext)

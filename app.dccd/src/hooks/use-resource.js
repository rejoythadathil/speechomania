import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api.js'

export function useResource(path, query) {
  const key = JSON.stringify([path, query ?? null])
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const [currentPath, currentQuery] = JSON.parse(key)
    if (!currentPath) return undefined
    let active = true
    setState((current) => ({ ...current, loading: true }))
    api(currentPath, { query: currentQuery ?? undefined })
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error, loading: false }))
    return () => {
      active = false
    }
  }, [key, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  return { ...state, reload }
}

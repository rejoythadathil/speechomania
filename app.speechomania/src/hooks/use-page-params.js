import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export const PAGE_SIZES = [10, 20, 50, 100]

export function usePageParams(defaultSize) {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
  const requested = Number.parseInt(params.get('size'), 10)
  const pageSize = PAGE_SIZES.includes(requested) ? requested : defaultSize

  const update = useCallback((changes) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === '') next.delete(key)
        else next.set(key, String(value))
      }
      return next
    })
  }, [setParams])

  const setPage = useCallback((value) => {
    update({ page: value > 1 ? value : null })
    window.scrollTo({ top: 0 })
  }, [update])

  const setPageSize = useCallback((value) => update({ size: value === defaultSize ? null : value, page: null }), [update, defaultSize])

  return { page, pageSize, setPage, setPageSize, setParam: (key, value) => update({ [key]: value, page: null }), params }
}

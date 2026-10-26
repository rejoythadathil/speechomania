import { RiArrowDownSLine } from '@remixicon/react'
import { useEffect } from 'react'
import { Pagination } from '@/components/base/pagination/pagination'
import { PAGE_SIZES } from '@/hooks/use-page-params.js'

export function ListFooter({ data, page, onPage, pageSize, onPageSize, noun = 'items' }) {
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1

  useEffect(() => {
    if (data && total > 0 && page > totalPages) onPage(totalPages)
  }, [data, total, page, totalPages, onPage])

  if (!data || !total) return null
  const from = (data.page - 1) * data.page_size + 1
  const to = Math.min(total, data.page * data.page_size)

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-body-2-medium text-text-secondary" aria-live="polite">
        {from === 1 && to === total ? `${total} ${noun}` : `${from}–${to} of ${total} ${noun}`}
      </span>
      {onPageSize ? (
        <label className="flex items-center gap-2 text-body-2-medium text-text-tertiary">
          Rows
          <span className="relative inline-flex">
            <select
              value={pageSize}
              onChange={(event) => onPageSize(Number(event.target.value))}
              aria-label="Rows per page"
              className="appearance-none rounded-lg border border-[var(--line)] bg-[var(--surface)] py-1 pr-7 pl-2.5 text-body-2-medium text-text-primary outline-none transition-colors hover:border-[var(--line-strong)] focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden />
          </span>
        </label>
      ) : null}
      <div className="ml-auto min-w-0">
        {totalPages > 1 ? <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={onPage} /> : null}
      </div>
    </div>
  )
}

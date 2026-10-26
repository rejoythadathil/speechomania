import { RiBarChart2Line, RiTableLine } from '@remixicon/react'
import { useState } from 'react'
import { Panel } from '../panel.jsx'
import { cx } from '@/utils/cx'

function ViewToggle({ view, onChange }) {
  const options = [{ id: 'chart', label: 'Chart', icon: RiBarChart2Line }, { id: 'table', label: 'Table', icon: RiTableLine }]
  return (
    <div role="radiogroup" aria-label="View" className="inline-flex rounded-lg border border-[var(--line)] p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={view === option.id}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.id)}
          className={cx('inline-flex size-6 items-center justify-center rounded-md text-text-tertiary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring', view === option.id && 'bg-[#eef0f3] text-text-primary')}
        >
          <option.icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  )
}

export function ChartPanel({ title, description, headline, table, children, className }) {
  const [view, setView] = useState('chart')
  return (
    <Panel title={title} description={description} actions={<ViewToggle view={view} onChange={setView} />} className={className}>
      {headline ? <div className="mb-3 flex flex-wrap items-center gap-2">{headline}</div> : null}
      {view === 'chart' ? children : (
        <div className="max-h-72 overflow-auto rounded-lg border border-[var(--line)]">
          <table className="bui-table bui-table-sm">
            <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{table.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index} className={index ? 'tabular-nums' : undefined}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

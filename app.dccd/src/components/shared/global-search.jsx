import { RiArrowRightUpLine, RiBookOpenLine, RiCornerDownLeftLine, RiSearchLine, RiUserHeartLine } from '@remixicon/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import styles from './global-search.module.css'

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function buildGroups(q, pages, data) {
  const groups = []
  const term = q.toLowerCase()
  const pageHits = pages.filter((item) => item.label.toLowerCase().includes(term)).slice(0, 4)
  if (pageHits.length) {
    groups.push({ key: 'pages', label: 'Pages', options: pageHits.map((item) => ({ id: `page-${item.to}`, to: item.to, icon: item.icon, title: item.label, detail: 'Go to page' })) })
  }
  const found = data?.groups ?? {}
  if (found.children?.items.length) {
    groups.push({
      key: 'children',
      label: 'Children',
      total: found.children.total,
      all: `/children?q=${encodeURIComponent(q)}`,
      options: found.children.items.map((child) => ({ id: `child-${child.id}`, to: `/children/${child.id}`, icon: RiUserHeartLine, title: child.display_name, detail: [child.parent_name, child.mentor_name ? `Mentor: ${child.mentor_name}` : 'No mentor yet'].filter(Boolean).join(' · '), chip: child.status === 'active' ? null : child.status }))
    })
  }
  if (found.lessons?.items.length) {
    groups.push({
      key: 'lessons',
      label: 'Lessons',
      total: found.lessons.total,
      all: `/lessons?q=${encodeURIComponent(q)}`,
      options: found.lessons.items.map((lesson) => ({ id: `lesson-${lesson.id}`, to: `/lessons/${lesson.id}`, icon: RiBookOpenLine, title: lesson.title, detail: `${lesson.slug} · v${lesson.version}`, chip: lesson.status }))
    })
  }
  if (found.people?.items.length) {
    groups.push({
      key: 'people',
      label: 'People',
      total: found.people.total,
      all: `/people/${found.people.items[0].role}?q=${encodeURIComponent(q)}`,
      options: found.people.items.map((person) => ({ id: `person-${person.id}`, to: `/people/${person.role}?q=${encodeURIComponent(person.email)}`, avatar: person.avatar, title: person.full_name, detail: person.email, chip: person.role }))
    })
  }
  return groups.map((group) => (group.all && group.total > group.options.length
    ? { ...group, options: [...group.options, { id: `all-${group.key}`, to: group.all, icon: RiArrowRightUpLine, title: `See all ${group.total} ${group.label.toLowerCase()}`, isMore: true }] }
    : group))
}

export function GlobalSearch({ pages }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const listId = useId()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const q = useDebounced(value.trim(), 200)
  const results = useResource(q.length >= 2 ? '/search' : null, { q })
  const groups = useMemo(() => (value.trim() ? buildGroups(value.trim(), pages, q.length >= 2 ? results.data : null) : []), [value, q, pages, results.data])
  const options = groups.flatMap((group) => group.options)
  const searching = q.length >= 2 && results.loading
  const showPanel = open && value.trim().length > 0

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        setOpen(true)
      }
    }
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  function go(option) {
    if (!option) return
    navigate(option.to)
    setValue('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => (options.length ? (current + 1) % options.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (options.length ? (current - 1 + options.length) % options.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(options[Math.min(active, options.length - 1)])
    } else if (event.key === 'Escape') {
      if (value) setValue('')
      else inputRef.current?.blur()
      setOpen(false)
    }
  }

  const activeOption = showPanel ? options[Math.min(active, options.length - 1)] : null

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.field}>
        <RiSearchLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => { setValue(event.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={user.role === 'admin' ? 'Search children, lessons, people…' : user.role === 'mentor' ? 'Search children and lessons…' : 'Search your children…'}
          role="combobox"
          aria-label="Search"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
        />
        <kbd aria-hidden>{MAC ? '⌘K' : 'Ctrl K'}</kbd>
      </div>
      {showPanel ? (
        <div className={styles.panel}>
          <ul id={listId} role="listbox" aria-label="Search results" className="m-0 flex list-none flex-col p-0">
            {groups.map((group) => (
              <li key={group.key} role="presentation">
                <div className={styles.groupLabel} role="presentation">
                  {group.label}
                  {group.total ? <span>{group.total}</span> : null}
                </div>
                <ul role="group" aria-label={group.label} className="m-0 list-none p-0">
                  {group.options.map((option) => {
                    const index = options.indexOf(option)
                    return (
                      <li
                        key={option.id}
                        id={`${listId}-${option.id}`}
                        role="option"
                        aria-selected={option === activeOption}
                        className={cx(styles.option, option === activeOption && styles.active, option.isMore && styles.more)}
                        onPointerMove={() => setActive(index)}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => go(option)}
                      >
                        {option.avatar ? <UserAvatar seed={option.avatar} size={24} /> : <option.icon className="size-4 shrink-0 text-text-tertiary" aria-hidden />}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-body-2-semibold text-text-primary">{option.title}</span>
                          {option.detail ? <span className="truncate text-caption-1-medium text-text-tertiary">{option.detail}</span> : null}
                        </span>
                        {option.chip ? <StatusChip value={option.chip} /> : null}
                        {option === activeOption ? <RiCornerDownLeftLine className="size-3.5 shrink-0 text-text-tertiary" aria-hidden /> : null}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
          {!options.length ? (
            <p className={styles.status} role="status">
              {value.trim().length < 2 ? 'Keep typing to search…' : searching ? 'Searching…' : `Nothing matches “${value.trim()}”`}
            </p>
          ) : null}
          <div className={styles.hint} aria-hidden>
            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

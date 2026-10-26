import { RiCloseLine, RiLogoutBoxRLine, RiMenuLine, RiPulseLine, RiSettings3Line } from '@remixicon/react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { IconButton } from '@/components/base/buttons/icon-button'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { GlobalSearch } from '@/components/shared/global-search.jsx'
import { RouterButton } from '@/components/shared/router-button.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import { NAVIGATION, ROLE_LABEL } from './navigation.js'
import styles from './work-layout.module.css'

const LIQUID = [0.22, 1, 0.36, 1]

function Brand() {
  return (
    <div className={styles.brand}>
      <BrandMark size={30} />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-headline-semibold text-brand-navy">DCCD</span>
        <span className="text-caption-1-medium text-text-tertiary">Learning platform</span>
      </div>
    </div>
  )
}

function searchablePages(role) {
  const items = NAVIGATION[role].flatMap((group) => group.items)
  return role === 'parent' ? items : [...items, { to: '/settings', label: 'Settings', icon: RiSettings3Line }]
}

function pageTitle(role, pathname) {
  if (pathname.startsWith('/settings')) return 'Settings'
  const items = NAVIGATION[role].flatMap((group) => group.items)
  return items.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))?.label ?? ''
}

function NavItem({ item, pathname, count }) {
  const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
  return (
    <NavLink to={item.to} className={cx(styles.link, active && styles.active)} aria-current={active ? 'page' : undefined}>
      {active ? <motion.span layoutId="nav-indicator" className={styles.indicator} transition={{ duration: 0.32, ease: LIQUID }} /> : null}
      <item.icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      {count ? <span className={styles.badge} aria-label={`${count} need attention`}>{count}</span> : null}
    </NavLink>
  )
}

export function WorkLayout() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const badges = useResource(user.role === 'parent' ? null : '/dashboard/badges')
  const reloadBadges = badges.reload

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => reloadBadges(), [location.pathname, reloadBadges])

  return (
    <div className={styles.shell}>
      <aside className={cx(styles.sidebar, open && styles.open)} aria-label="Main navigation">
        <Brand />
        <nav className={styles.nav}>
          {NAVIGATION[user.role].map((group) => (
            <div key={group.label} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => <NavItem key={item.to} item={item} pathname={location.pathname} count={badges.data?.[item.to]} />)}
            </div>
          ))}
        </nav>
        <div className={styles.account}>
          <UserAvatar seed={user.avatar} name={user.full_name} size={32} />
          {user.role !== 'parent' ? (
            <Link to="/settings" className="flex min-w-0 flex-1 flex-col rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
              <span className="truncate text-body-2-semibold text-text-primary">{user.full_name}</span>
              <span className="truncate text-caption-1-medium text-text-tertiary">{ROLE_LABEL[user.role]} · {user.email}</span>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-body-2-semibold text-text-primary">{user.full_name}</span>
              <span className="truncate text-caption-1-medium text-text-tertiary">{ROLE_LABEL[user.role]} · {user.email}</span>
            </div>
          )}
          <button type="button" className={styles.signOut} aria-label="Sign out" title="Sign out" onClick={signOut}>
            <RiLogoutBoxRLine className="size-4" aria-hidden />
          </button>
        </div>
      </aside>
      {open ? <button type="button" className={styles.scrim} aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <div className={styles.column}>
      <header className={styles.header}>
        <span className={styles.menuButton}>
          <IconButton icon={open ? RiCloseLine : RiMenuLine} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)} />
        </span>
        <span className={styles.pageTitle}>{pageTitle(user.role, location.pathname)}</span>
        <div className={styles.headerActions}>
          <GlobalSearch pages={searchablePages(user.role)} />
          {user.role !== 'parent' ? (
            <>
              <span className={styles.wide}>
                {user.role === 'admin' ? <RouterButton to="/audit" variant="secondary" size="small" leadingIcon={RiPulseLine}>Audit log</RouterButton> : null}
                <RouterButton to="/settings" variant="secondary" size="small" leadingIcon={RiSettings3Line}>Settings</RouterButton>
              </span>
              <Link to="/settings" className={styles.avatarButton} aria-label="Open your settings" title={user.full_name}>
                <UserAvatar seed={user.avatar} name={user.full_name} size={36} />
              </Link>
            </>
          ) : <UserAvatar seed={user.avatar} name={user.full_name} size={36} />}
        </div>
      </header>
      <main className={styles.main}>
        <motion.div
          key={location.pathname}
          className={styles.content}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: LIQUID }}
        >
          <Outlet />
        </motion.div>
      </main>
      </div>
    </div>
  )
}

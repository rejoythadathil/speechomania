import { RiChat3Line, RiCheckDoubleLine, RiCheckLine, RiEditBoxLine, RiLockPasswordLine, RiRefreshLine, RiUserHeartLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { DataState } from '@/components/shared/data-state.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { KpiTile } from '@/components/shared/kpi-tile.jsx'
import { PageHeader } from '@/components/shared/page-header.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { StatStrip } from '@/components/shared/stat-card.jsx'
import { StatusChip } from '@/components/shared/status-chip.jsx'
import { useToast } from '@/components/shared/toast.jsx'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { useResource } from '@/hooks/use-resource.js'
import { api, fieldErrors } from '@/services/api.js'
import { cx } from '@/utils/cx'
import { formatDate } from '@/utils/format'

const STATS = {
  mentor: [
    { key: 'children', label: 'Children assigned', icon: RiUserHeartLine },
    { key: 'remarks', label: 'Remarks written', icon: RiChat3Line },
    { key: 'change_requests', label: 'Change requests sent', icon: RiEditBoxLine }
  ],
  admin: [
    { key: 'remarks', label: 'Remarks written', icon: RiChat3Line },
    { key: 'reviews', label: 'Change requests reviewed', icon: RiCheckDoubleLine }
  ]
}

function Cover() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="cover-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38b6ff" />
          <stop offset="1" stopColor="#1479bb" />
        </linearGradient>
      </defs>
      <rect width="1200" height="160" fill="url(#cover-sky)" />
      <circle cx="1040" cy="150" r="150" fill="#ffffff" opacity="0.07" />
      <circle cx="1040" cy="150" r="96" fill="#ffffff" opacity="0.08" />
      <rect x="980" y="62" width="22" height="64" rx="11" fill="#ffffff" opacity="0.3" />
      <rect x="1018" y="34" width="22" height="120" rx="11" fill="#ffffff" opacity="0.45" />
      <rect x="1056" y="48" width="22" height="92" rx="11" fill="#ffffff" opacity="0.3" />
      <rect x="1094" y="74" width="22" height="40" rx="11" fill="#ffffff" opacity="0.2" />
      <circle cx="120" cy="-30" r="90" fill="#ffffff" opacity="0.07" />
    </svg>
  )
}

function AvatarPicker({ profile, onSaved }) {
  const notify = useToast()
  const [round, setRound] = useState(0)
  const [pending, setPending] = useState(null)
  const base = profile.id.slice(-12)
  const faces = [profile.id, ...Array.from({ length: 11 }, (_, index) => `${base}-${round * 11 + index + 1}`)]
  const options = faces.includes(profile.avatar) ? faces : [profile.avatar, ...faces.slice(0, 11)]

  async function choose(seed) {
    if (seed === profile.avatar) return
    setPending(seed)
    try {
      onSaved(await api('/auth/me', { method: 'PATCH', body: { avatar: seed } }), 'Avatar updated')
    } catch (failure) {
      notify(failure.message)
    } finally {
      setPending(null)
    }
  }

  return (
    <Panel
      title="Avatar"
      description="Pick a face. It shows next to your name and remarks."
      actions={<Button variant="secondary" size="xs" leadingIcon={RiRefreshLine} onClick={() => setRound(round + 1)}>More faces</Button>}
    >
      <div role="radiogroup" aria-label="Choose your avatar" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {options.map((seed) => {
          const selected = seed === profile.avatar
          return (
            <button
              key={seed}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={selected ? 'Current avatar' : 'Use this avatar'}
              disabled={Boolean(pending)}
              onClick={() => choose(seed)}
              className={cx(
                'relative flex aspect-square items-center justify-center rounded-xl border bg-[var(--surface-muted)] p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring',
                selected ? 'border-accent-500 bg-accent-50' : 'border-[var(--line)] hover:border-[var(--line-strong)]',
                pending === seed && 'opacity-60'
              )}
            >
              <UserAvatar seed={seed} size={56} className="size-full" />
              {selected ? <RiCheckLine className="absolute top-1 right-1 size-4 rounded-full bg-accent-600 p-0.5 text-white" aria-hidden /> : null}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

function DetailsForm({ profile, onSaved }) {
  const [form, setForm] = useState({ full_name: profile.full_name, phone: profile.phone ?? '' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))
  const changed = form.full_name.trim() !== profile.full_name || form.phone.trim() !== (profile.phone ?? '')

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      onSaved(await api('/auth/me', { method: 'PATCH', body: { full_name: form.full_name, phone: form.phone } }))
    } catch (failure) {
      setError(failure)
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel title="Your details" description="Your name is shown to parents next to your remarks.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={form.full_name} onChange={set('full_name')} isRequired isInvalid={Boolean(errors.full_name)} hint={errors.full_name} />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} isInvalid={Boolean(errors.phone)} hint={errors.phone ?? 'Optional'} />
          <Input label="Email" value={profile.email} isReadOnly hint="Ask an admin to change your sign-in email." />
          <Input label="Role" value={profile.role === 'admin' ? 'Administrator' : 'Mentor'} isReadOnly />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !changed}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </Panel>
  )
}

function Security({ email }) {
  const { resetPassword } = useAuth()
  const notify = useToast()
  const [pending, setPending] = useState(false)

  async function send() {
    setPending(true)
    try {
      await resetPassword(email)
      notify(`Password reset link sent to ${email}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel title="Password" description="We email you a link to choose a new password.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-body-2-medium text-text-secondary">
          <RiLockPasswordLine className="size-4 text-text-tertiary" aria-hidden />
          {email}
        </span>
        <Button variant="secondary" size="small" onClick={send} disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</Button>
      </div>
    </Panel>
  )
}

export function SettingsView() {
  const { setUser } = useAuth()
  const notify = useToast()
  const profile = useResource('/auth/me')
  const data = profile.data

  function saved(next, message = 'Your details are saved') {
    setUser(next)
    profile.reload()
    notify(message)
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile and sign-in details." />
      <DataState loading={profile.loading && !data} error={profile.error} onRetry={profile.reload}>
        {data ? (
          <>
            <section className="surface overflow-hidden">
              <div className="relative h-32 sm:h-40"><Cover /></div>
              <div className="flex flex-wrap items-end gap-4 px-4 pb-4">
              <UserAvatar seed={data.avatar} name={data.full_name} size={96} className="relative z-10 -mt-12 border-4 border-white" />
              <div className="flex min-w-0 flex-1 flex-col gap-1 pt-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-title-2-semibold text-text-primary">{data.full_name}</span>
                  <StatusChip value={data.role} />
                </span>
                <span className="text-body-2-medium text-text-secondary">{data.email}{data.phone ? ` · ${data.phone}` : ''}</span>
                <span className="text-caption-1-medium text-text-tertiary">With Speechomania since {formatDate(data.created_at)}</span>
              </div>
              </div>
            </section>
            {STATS[data.role] ? (
              <StatStrip className={data.role === 'mentor' ? 'grid-cols-1 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3 [&>*:last-child]:col-span-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 [&>*:last-child]:col-span-1'}>
                {STATS[data.role].map((stat) => <KpiTile key={stat.key} label={stat.label} icon={stat.icon} value={data.stats[stat.key]} />)}
              </StatStrip>
            ) : null}
            <AvatarPicker profile={data} onSaved={saved} />
            <DetailsForm key={data.full_name + data.phone} profile={data} onSaved={saved} />
            <Security email={data.email} />
          </>
        ) : null}
      </DataState>
    </>
  )
}

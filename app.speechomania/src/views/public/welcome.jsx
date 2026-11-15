import { useState } from 'react'
import { Navigate } from 'react-router'
import { homeFor, useAuth } from '@/hooks/use-auth.jsx'
import { cx } from '@/utils/cx'
import base from './landing.module.css'
import { PublicHeader } from './public-header.jsx'
import styles from './start.module.css'

export function WelcomeView() {
  const auth = useAuth()
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  if (auth.status === 'loading') return null
  if (auth.status !== 'new')
    return <Navigate to={auth.status === 'signed-in' ? homeFor(auth) : '/login'} replace />

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) return setError('Enter your child’s name or nickname.')
    if (!consent) return setError('Tick the box to agree before you start.')
    setPending(true)
    setError(null)
    try {
      await auth.signUp(name.trim())
    } catch (caught) {
      setError(caught.message)
      setPending(false)
    }
  }

  return (
    <div className={base.page}>
      <PublicHeader nav={false} tryLink={false} />
      <main className={styles.main}>
        <form className={styles.card} onSubmit={submit} noValidate>
          <h1>Welcome to Speechomania</h1>
          <p>
            Signed in as {auth.user.email}. Tell us your child’s name and their games will be ready
            in a moment.
          </p>
          <label className={styles.field}>
            Child’s name or nickname
            <input
              autoFocus
              autoComplete="off"
              maxLength={40}
              value={name}
              onChange={(event) => {
                setError(null)
                setName(event.target.value)
              }}
              aria-invalid={Boolean(error) && !name.trim()}
            />
          </label>
          <label className={styles.tick}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setError(null)
                setConsent(event.target.checked)
              }}
            />
            <span>
              I am this child’s parent or guardian and I agree to Speechomania storing their details
              and learning progress (consent v1).
            </span>
          </label>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.acts}>
            <button
              type="button"
              className={cx(base.btn, base.ghost)}
              onClick={() => auth.signOut()}
            >
              Not you? Sign out
            </button>
            <button
              type="submit"
              className={cx(base.btn, base.primary, styles.grow)}
              disabled={pending}
            >
              {pending ? 'Getting ready…' : 'Start learning'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

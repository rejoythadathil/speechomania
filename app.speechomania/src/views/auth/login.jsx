import { useState } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { LinkButton } from '@/components/base/buttons/link-button'
import { Input } from '@/components/base/input/input'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { homeFor, useAuth } from '@/hooks/use-auth.jsx'
import googleLogo from '@/assets/brands/google.svg'
import styles from './login.module.css'

const SIGN_IN_ERRORS = {
  'auth/invalid-credential':
    'That email and password do not match. Try again or reset your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/user-disabled': 'This account is not active. Contact Speechomania.',
  'auth/account-exists-with-different-credential':
    'This email already has a password. Sign in with it once below and Google will work from then on.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.'
}
const QUIET = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

export function LoginView() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (auth.status === 'signed-in') return <Navigate to={homeFor(auth.user)} replace />

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      await auth.signIn(email.trim(), password)
    } catch (caught) {
      setError({ message: SIGN_IN_ERRORS[caught.code] ?? 'We could not sign you in. Try again.' })
    } finally {
      setPending(false)
    }
  }

  async function google() {
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      await auth.signInWithGoogle()
    } catch (caught) {
      if (!QUIET.includes(caught.code)) {
        setError({ message: SIGN_IN_ERRORS[caught.code] ?? 'We could not sign you in. Try again.' })
      }
    } finally {
      setPending(false)
    }
  }

  async function reset() {
    if (!email.trim()) {
      setError({ message: 'Enter your email first, then choose “Forgot password”.' })
      return
    }
    await auth.resetPassword(email.trim()).catch(() => null)
    setError(null)
    setNotice('If that email has an account, a reset link is on its way.')
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.brand}>
          <BrandMark size={40} />
          <span className="font-display text-headline-semibold text-text-primary">
            Speechomania
          </span>
        </div>
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-display text-title-1-semibold text-text-primary">Welcome back</h1>
            <p className="text-body-regular text-text-secondary">
              Use the email Speechomania invited you with.
            </p>
          </div>
          <FormAlert error={error ?? (auth.error ? { message: auth.error } : null)} />
          {notice ? (
            <p
              role="status"
              className="rounded-2xl bg-brand-teal-soft px-3 py-2.5 text-body-2-medium text-brand-teal"
            >
              {notice}
            </p>
          ) : null}
          <Button variant="secondary" onClick={google} disabled={pending}>
            <img src={googleLogo} alt="" width={18} height={18} className="mr-2" />
            Continue with Google
          </Button>
          <div className={styles.or}>
            <span>or</span>
          </div>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            isRequired
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            isRequired
          />
          <Button type="submit" disabled={pending || !email || !password}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
          <LinkButton
            variant="secondary"
            size="small"
            type="button"
            onClick={reset}
            className="self-center"
          >
            Forgot password
          </LinkButton>
        </form>
      </main>
      <footer className={styles.footer}>A product of Autism Synergies</footer>
    </div>
  )
}

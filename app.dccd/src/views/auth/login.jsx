import { useState } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { LinkButton } from '@/components/base/buttons/link-button'
import { Input } from '@/components/base/input/input'
import { BrandMark } from '@/components/shared/brand-mark.jsx'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import styles from './login.module.css'

const SIGN_IN_ERRORS = {
  'auth/invalid-credential': 'That email and password do not match. Try again or reset your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/user-disabled': 'This account is not active. Contact DCCD.'
}

export function LoginView() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (auth.status === 'signed-in') return <Navigate to="/dashboard" replace />

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
      <section className={styles.story}>
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-2xl bg-white p-2"><BrandMark size={36} /></span>
          <span className="text-body-medium text-white/80">Dimensions Centre for Child Development</span>
        </div>
        <div className="relative z-10 flex max-w-lg flex-col gap-4">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold">Every child deserves to be heard.</h1>
          <p className="text-body-regular text-white/80">
            One place for DCCD’s therapists, mentors and families to follow each child’s learning, share notes and shape lessons together.
          </p>
        </div>
        <p className="relative z-10 text-caption-1-medium text-white/60">Speech · Occupational · Behaviour therapy</p>
      </section>
      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-title-1-semibold text-text-primary">Sign in</h2>
            <p className="text-body-regular text-text-secondary">Use the email DCCD invited you with.</p>
          </div>
          <FormAlert error={error ?? (auth.error ? { message: auth.error } : null)} />
          {notice ? <p role="status" className="rounded-2xl bg-brand-teal-soft px-3 py-2.5 text-body-2-medium text-brand-teal">{notice}</p> : null}
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} isRequired />
          <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} isRequired />
          <Button type="submit" disabled={pending || !email || !password}>{pending ? 'Signing in…' : 'Sign in'}</Button>
          <LinkButton variant="secondary" size="small" type="button" onClick={reset} className="self-start">Forgot password</LinkButton>
        </form>
      </section>
    </div>
  )
}

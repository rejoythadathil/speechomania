import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { cx } from '@/utils/cx'
import base from './landing.module.css'
import { PublicHeader } from './public-header.jsx'
import styles from './start.module.css'

const STEPS = ['intro', 'email', 'phone', 'name', 'age', 'level', 'plan', 'soon']
const AGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']
const LEVELS = ['Violet', 'Indigo', 'Blue', 'Green', 'Yellow', 'Orange', 'Red']
const PLANS = [
  { id: 'annual', name: 'Annual plan', billing: 'Billed once a year' },
  { id: 'monthly', name: 'Monthly plan', billing: 'Billed every month' }
]
const INCLUDED = [
  'Every game and its picture flashcards',
  'A calm voice that reads every word',
  'Stars, medals, trophies and animal friends',
  'Screen-time breaks built in'
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function StartView() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    email: '',
    news: false,
    phone: '',
    name: '',
    age: null,
    plan: 'annual'
  })
  const [error, setError] = useState(null)
  const focus = useRef(null)
  const name = STEPS[step]
  const child = form.name.trim() || 'your child'

  useEffect(() => {
    focus.current?.focus()
  }, [step])

  const set = (key) => (event) => {
    setError(null)
    setForm((current) => ({
      ...current,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }))
  }
  const back = () => {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }
  const next = (event) => {
    event?.preventDefault()
    if (name === 'email' && !EMAIL.test(form.email.trim())) {
      return setError('Enter an email address like name@example.com.')
    }
    if (name === 'name' && !form.name.trim()) return setError('Enter a name or nickname.')
    if (name === 'age' && !form.age) return setError('Choose an age.')
    setError(null)
    setStep((current) => Math.min(STEPS.length - 1, current + 1))
  }

  return (
    <div className={base.page}>
      <PublicHeader nav={false} tryLink={false} />
      <main className={styles.main}>
        {name !== 'soon' ? (
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Sign-up progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length - 1}
            aria-valuenow={step + 1}
          >
            <i style={{ width: `${((step + 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        ) : null}

        <form className={styles.card} onSubmit={next} noValidate>
          {name === 'intro' ? (
            <>
              <h1>Let’s get started</h1>
              <p>
                We need a little more info from you to help us set up your account and personalise
                your experience.
              </p>
            </>
          ) : null}

          {name === 'email' ? (
            <>
              <h1>What’s your email?</h1>
              <label className={styles.field}>
                Email
                <input
                  ref={focus}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  aria-invalid={Boolean(error)}
                />
              </label>
              <label className={styles.tick}>
                <input type="checkbox" checked={form.news} onChange={set('news')} />
                <span>
                  Exclusive offers, giveaways from Speechomania, and other services that might
                  interest me? Count me in!
                </span>
              </label>
            </>
          ) : null}

          {name === 'phone' ? (
            <>
              <h1>Your phone number</h1>
              <p>Optional. Leave it empty to skip.</p>
              <label className={styles.field}>
                Phone
                <input
                  ref={focus}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </label>
            </>
          ) : null}

          {name === 'name' ? (
            <>
              <h1>What’s your child’s name?</h1>
              <p>A nickname is fine.</p>
              <label className={styles.field}>
                Name or nickname
                <input
                  ref={focus}
                  autoComplete="off"
                  maxLength={40}
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={Boolean(error)}
                />
              </label>
            </>
          ) : null}

          {name === 'age' ? (
            <>
              <h1>How old is {child}?</h1>
              <div className={styles.ages} role="radiogroup" aria-label="Age">
                {AGES.map((age) => (
                  <button
                    key={age}
                    type="button"
                    role="radio"
                    aria-checked={form.age === age}
                    className={cx(styles.age, form.age === age && styles.chosen)}
                    onClick={() => {
                      setError(null)
                      setForm((current) => ({ ...current, age }))
                    }}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {name === 'level' ? (
            <>
              <span className={base.label}>Our recommendation</span>
              <h1>{child} starts at Violet.</h1>
              <p>
                Learning grows through the colours of the rainbow, from Violet to Red. Each colour
                adds a little more to learn.
              </p>
              <ol className={styles.levels} aria-label="Learning levels, easiest first">
                {LEVELS.map((level, index) => (
                  <li key={level} className={cx(index === 0 && styles.current)}>
                    <i data-level={level.toLowerCase()} />
                    {level}
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          {name === 'plan' ? (
            <>
              <h1>Choose a plan</h1>
              <div className={styles.plans} role="radiogroup" aria-label="Plan">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={form.plan === plan.id}
                    className={cx(styles.plan, form.plan === plan.id && styles.chosen)}
                    onClick={() => setForm((current) => ({ ...current, plan: plan.id }))}
                  >
                    <b>{plan.name}</b>
                    <span>{plan.billing}</span>
                    <em>Price announced soon</em>
                  </button>
                ))}
              </div>
              <ul className={styles.included}>
                {INCLUDED.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}

          {name === 'soon' ? (
            <>
              <h1>Online sign-up opens soon.</h1>
              <p>
                Thank you for your interest. Nothing you typed was saved or sent, and you have not
                been charged.
              </p>
              <p>Families can get an account from their centre today.</p>
              <div className={styles.endActs}>
                <Link className={cx(base.btn, base.primary)} to="/login">
                  Sign in
                </Link>
                <Link className={cx(base.btn, base.ghost)} to="/">
                  Back to Speechomania
                </Link>
              </div>
            </>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          {name !== 'soon' ? (
            <div className={styles.acts}>
              {step > 0 ? (
                <button type="button" className={cx(base.btn, base.ghost)} onClick={back}>
                  Back
                </button>
              ) : null}
              <button
                type="submit"
                ref={name === 'intro' || name === 'level' || name === 'plan' ? focus : null}
                className={cx(base.btn, base.primary, styles.grow)}
              >
                {name === 'plan'
                  ? 'Continue to pay'
                  : name === 'level'
                    ? 'Continue'
                    : name === 'phone' && !form.phone.trim()
                      ? 'Skip'
                      : 'Next'}
              </button>
            </div>
          ) : null}
        </form>
      </main>
    </div>
  )
}

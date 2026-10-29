import { useEffect, useRef, useState } from 'react'
import { cx } from '@/utils/cx'
import { NextIcon } from './child-icons.jsx'
import styles from './child.module.css'

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="child-sheet-title">
      <div className={cx(styles.card, styles.sheet)}>
        <h2 id="child-sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function BreakSheet({ onClose }) {
  return (
    <Sheet title="Break time" onClose={onClose}>
      <div className={styles.breath} aria-hidden="true">
        <span className={styles.orb} />
        <b className={styles.breathWord} />
      </div>
      <p>Follow the circle. Big when you breathe in, small when you breathe out.</p>
      <button type="button" className={styles.go} onClick={onClose} autoFocus>
        I’m ready
        <NextIcon size={26} />
      </button>
    </Sheet>
  )
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

function PinPad({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function press(key) {
    if (pending || !key) return
    if (key === '⌫') return setPin((value) => value.slice(0, -1))
    const next = `${pin}${key}`.slice(0, 4)
    setPin(next)
    setError('')
    if (next.length < 4) return
    setPending(true)
    try {
      await onUnlock(next)
    } catch (caught) {
      setError(caught.message)
      setPin('')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <p>Type your 4-digit PIN.</p>
      <div className={styles.pinDots} aria-label={`${pin.length} of 4 digits`}>
        {[0, 1, 2, 3].map((index) => <span key={index} className={cx(styles.pinDot, index < pin.length && styles.pinDotOn)} />)}
      </div>
      <div className={styles.pinPad}>
        {DIGITS.map((key, index) => (key ? (
          <button key={key} type="button" className={styles.digit} onClick={() => press(key)} aria-label={key === '⌫' ? 'Delete' : key}>{key}</button>
        ) : <span key={`gap-${index}`} />))}
      </div>
      <span className={styles.error} role="alert">{error}</span>
    </>
  )
}

function HoldButton({ onUnlock }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef(null)
  const start = () => {
    setHolding(true)
    timer.current = setTimeout(() => onUnlock(null), 2000)
  }
  const cancel = () => {
    setHolding(false)
    clearTimeout(timer.current)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <>
      <p>Grown-ups: press and hold the button.</p>
      <button
        type="button"
        className={cx(styles.go, styles.hold, holding && styles.holding)}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !holding && start()}
        onKeyUp={cancel}
      >
        <span className={styles.holdFill} />
        Hold to leave
      </button>
    </>
  )
}

export function GrownUpSheet({ hasPin, onUnlock, onClose }) {
  return (
    <Sheet title="Leaving the lesson?" onClose={onClose}>
      {hasPin ? <PinPad onUnlock={onUnlock} /> : <HoldButton onUnlock={onUnlock} />}
      <button type="button" className={styles.pill} onClick={onClose}>Keep learning</button>
    </Sheet>
  )
}

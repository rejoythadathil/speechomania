import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { api } from '@/services/api.js'
import base from './landing.module.css'
import styles from './legal.module.css'
import { PublicFooter } from './public-footer.jsx'
import { PublicHeader } from './public-header.jsx'

const CODE = /^SPM-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/

async function sha256Of(file) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function message(result) {
  const what = result.kind ? `${result.kind} ${result.code}` : result.code
  if (result.status === 'genuine')
    return {
      tone: 'good',
      title: 'Genuine',
      body: `This file is the exact ${what} that Speechomania issued on ${result.issued_on}.`
    }
  if (result.status === 'issued')
    return {
      tone: 'neutral',
      title: 'This code is ours',
      body: `Speechomania issued ${what} on ${result.issued_on}. Add the PDF to check that it has not been changed.`
    }
  if (result.status === 'changed')
    return {
      tone: 'bad',
      title: 'This copy has been changed',
      body: `Speechomania issued ${what} on ${result.issued_on}, but this file is not that document. It has been edited, recreated or rebuilt. This check has been recorded.`
    }
  return {
    tone: 'bad',
    title: 'Not issued by Speechomania',
    body: result.code
      ? `Speechomania has no document with the code ${result.code}.`
      : 'Speechomania did not issue this file. If it shows a Speechomania code, enter it too.'
  }
}

const TONES = {
  good: 'border-[#3f9a5b] bg-[#eef8f1]',
  neutral: 'border-[var(--line)] bg-background-secondary',
  bad: 'border-[#c8483d] bg-[#fdf0ee]'
}

export function VerifyView() {
  const params = useParams()
  const [code, setCode] = useState(params.code?.toUpperCase() ?? '')
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const typed = code.trim().toUpperCase()

  useEffect(() => {
    document.title = 'Check a document · Speechomania'
  }, [])

  useEffect(() => {
    if (!params.code || !CODE.test(params.code.toUpperCase())) return
    api(`/verify/${params.code.toUpperCase()}`).then(setResult, (failure) =>
      setError(failure.message)
    )
  }, [params.code])

  async function check(event) {
    event.preventDefault()
    setError(null)
    setResult(null)
    if (typed && !CODE.test(typed)) return setError('A code looks like SPM-ABCD-2345.')
    if (!file && !typed) return setError('Add the PDF, enter its code, or both.')
    setPending(true)
    try {
      if (file) {
        setResult(
          await api('/verify', {
            method: 'POST',
            body: { sha256: await sha256Of(file), code: typed || null }
          })
        )
      } else {
        setResult(await api(`/verify/${typed}`))
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  const shown = result ? message(result) : null

  return (
    <div className={base.page}>
      <PublicHeader nav={false} />
      <main className={styles.main}>
        <article className={styles.doc}>
          <p className={base.label}>Documents</p>
          <h1>Check a Speechomania document</h1>
          <p className={styles.intro}>
            Every report and set of flashcards we issue has a code in its footer, like
            SPM-ABCD-2345. Add the PDF to check it is the exact file we issued. The file stays on
            your device; only its fingerprint is sent.
          </p>
          <form className={styles.section} onSubmit={check}>
            <Input
              label="Document code"
              placeholder="SPM-ABCD-2345"
              value={code}
              onChange={setCode}
              maxLength={13}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-body-2-semibold text-text-secondary">PDF file</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="text-body-2-medium text-text-secondary file:mr-3 file:rounded-lg file:border file:border-[var(--line)] file:bg-background-primary-default file:px-3 file:py-1.5 file:text-body-2-semibold"
              />
            </label>
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? 'Checking…' : 'Check'}
              </Button>
            </div>
            {error ? <p className="text-body-2-medium text-[#c8483d]">{error}</p> : null}
          </form>
          {shown ? (
            <section
              className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${TONES[shown.tone]}`}
              aria-live="polite"
            >
              <h2 className="text-title-3-semibold">{shown.title}</h2>
              <p>{shown.body}</p>
            </section>
          ) : null}
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}

import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { sql } from '../common-service/db/index.js'
import { config } from '../config/index.js'
import { app } from '../src/app.js'

const auth = getAuth(getApps()[0] ?? initializeApp({ projectId: config.FIREBASE_PROJECT_ID }))
const PASSWORD = 'test-password-123'

async function signIn(email) {
  const response = await fetch(`http://${config.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
  })
  return (await response.json()).idToken
}

export async function makeUser(role) {
  const email = `${role}.${crypto.randomUUID().slice(0, 8)}@test.speechomania.local`
  const { uid } = await auth.createUser({ email, password: PASSWORD, displayName: `Test ${role}` })
  const [{ id }] = await sql`
    INSERT INTO users (firebase_uid, email, full_name, role, status)
    VALUES (${uid}, ${email}, ${`Test ${role}`}, ${role}, 'active')
    RETURNING id
  `
  return { id, email, role, token: await signIn(email) }
}

export async function call(user, method, path, body, query) {
  const headers = { 'content-type': 'application/json' }
  if (user) headers.authorization = `Bearer ${user.token}`
  const search = query ? `?${new URLSearchParams(query)}` : ''
  const response = await app.request(`/v1${path}${search}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

export async function makeChild(parent, admin, mentor) {
  const { body } = await call(parent, 'POST', '/children', { display_name: 'Test child', consent_given: true })
  if (mentor) await call(admin, 'PUT', `/children/${body.id}/mentor`, { mentor_id: mentor.id })
  return body
}

export async function makePublishedLesson(admin, slug = `lesson-${crypto.randomUUID().slice(0, 8)}`) {
  const { body } = await call(admin, 'POST', '/lessons', { slug, title: 'Test lesson', content: { steps: [{ text: 'Step one' }] } })
  await call(admin, 'POST', `/lessons/${body.id}/publish`)
  return body
}

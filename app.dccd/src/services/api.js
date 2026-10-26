import { auth } from './firebase.js'

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${import.meta.env.VITE_API_URL}/v1${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }
  const token = await auth.currentUser?.getIdToken()
  const headers = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  let response
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'We could not reach the server. Check your connection and try again.')
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? 'Something went wrong. Try again.', data?.error?.details ?? [])
  }
  return data
}

const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function fieldErrors(error) {
  return Object.fromEntries((error?.details ?? []).map((detail) => [detail.field.split('.')[0], sentence(detail.message)]))
}

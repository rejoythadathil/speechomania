import { auth } from './firebase.js'

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${import.meta.env.VITE_API_URL}/v1${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }
  const token = await auth.currentUser?.getIdToken()
  const headers = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  try {
    return await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new ApiError(0, 'We could not reach the server. Check your connection and try again.')
  }
}

async function failure(response) {
  const data = await response.json().catch(() => null)
  return new ApiError(
    response.status,
    data?.error?.message ?? 'Something went wrong. Try again.',
    data?.error?.details ?? []
  )
}

export async function api(path, options) {
  const response = await request(path, options)
  if (response.status === 204) return null
  if (!response.ok) throw await failure(response)
  return response.json().catch(() => null)
}

export async function download(path, options) {
  const response = await request(path, options)
  if (!response.ok) throw await failure(response)
  const fileName =
    response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'download'
  const link = document.createElement('a')
  link.href = URL.createObjectURL(await response.blob())
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  return fileName
}

const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function fieldErrors(error) {
  return Object.fromEntries(
    (error?.details ?? []).map((detail) => [detail.field.split('.')[0], sentence(detail.message)])
  )
}

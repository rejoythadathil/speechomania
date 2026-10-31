export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const notFound = (what = 'Record') => new HttpError(404, `${what} not found`)

export const forbidden = () => new HttpError(403, 'You do not have permission to do this')

export const invalidJson = () => new HttpError(400, 'The request body must be valid JSON')

export const invalidFields = (details) => new HttpError(400, 'Some fields need attention', details)

export const signInRequired = () => new HttpError(401, 'Sign in to continue')

export const sessionExpired = () => new HttpError(401, 'Your session has expired. Sign in again.')

export const accountInactive = () => new HttpError(403, 'This account is not active. Contact Speechomania.')

export const tooManyRequests = () => new HttpError(429, 'Too many requests. Wait a minute and try again.')

import { HttpError } from '../../http/exception/index.js'

export const reportsBusy = () =>
  new HttpError(503, 'Reports are busy right now. Try again in a moment.')

export const tooManyExports = () =>
  new HttpError(429, 'That is a lot of downloads in a minute. Wait a moment and try again.')

export const tooManyRows = (count, max) =>
  new HttpError(400, `This export has ${count} rows; the limit is ${max}. Narrow the filters.`)

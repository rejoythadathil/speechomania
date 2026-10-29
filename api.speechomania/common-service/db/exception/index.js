import { HttpError } from '../../http/exception/index.js'
import { PG_ERRORS } from '../constants/index.js'

export function fromPostgres(error) {
  const known = PG_ERRORS[error?.errno]
  return known ? new HttpError(known[0], known[1]) : null
}

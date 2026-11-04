import { HttpError } from '../../http/exception/index.js'
import { PG_ERRORS } from '../constants/index.js'

export function fromPostgres(error) {
  const code =
    error?.meta?.driverAdapterError?.cause?.originalCode ??
    (error?.code === 'P2034' ? '40001' : undefined)
  const known = PG_ERRORS[code]
  return known ? new HttpError(known[0], known[1]) : null
}

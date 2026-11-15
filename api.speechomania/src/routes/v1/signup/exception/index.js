import { HttpError } from '../../../../../common-service/http/exception/index.js'

export const emailTaken = () =>
  new HttpError(
    409,
    'This email is already on Speechomania. Sign in with the email and password you were sent.'
  )

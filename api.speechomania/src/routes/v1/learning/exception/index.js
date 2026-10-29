import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const learnerNotFound = () => notFound('Child')

export const lessonNotFound = () => notFound('Lesson')

export const attemptNotFound = () => notFound('Attempt')

export const attemptFinished = () => new HttpError(409, 'This attempt is already finished')

export const tooManyEvents = () => new HttpError(409, 'This attempt has too many events')

export const wrongPin = () => new HttpError(400, 'That PIN is not right')

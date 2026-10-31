import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const requestNotFound = () => notFound('Change request')

export const alreadyReviewed = () => new HttpError(409, 'This request has already been reviewed')

export const noPublishedVersion = () => new HttpError(409, 'This lesson has no published version to change')

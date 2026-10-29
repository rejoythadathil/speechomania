import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const childNotFound = () => notFound('Child')

export const chooseActive = (label) => new HttpError(400, `Choose an active ${label}`)

export const chooseParent = () => new HttpError(400, 'Choose the parent for this child')

export const lessonsNotPublished = (slugs) => new HttpError(400, `These lessons are not published: ${slugs.join(', ')}`)

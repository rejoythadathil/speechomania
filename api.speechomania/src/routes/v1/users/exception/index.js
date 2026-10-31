import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const userNotFound = () => notFound('User')

export const cannotDisableSelf = () => new HttpError(400, 'You cannot disable your own account')

export const cannotRemoveSelf = () => new HttpError(400, 'You cannot remove your own account')

export const parentHasChildren = () => new HttpError(409, "Remove this parent's children first")

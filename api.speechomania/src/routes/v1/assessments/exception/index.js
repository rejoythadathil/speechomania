import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const assessmentNotFound = () => notFound('Assessment')

export const attemptNotFound = () => notFound('Attempt')

export const onlyDraftsEditable = () =>
  new HttpError(409, 'Only drafts can be edited. Archive this one and create a new assessment.')

export const onlyDraftsPublishable = () => new HttpError(409, 'Only drafts can be published')

export const noItems = () => new HttpError(400, 'Add at least one question before publishing')

export const cannotRemove = () =>
  new HttpError(409, 'Only drafts can be deleted and only published assessments can be archived')

export const notAssignable = () => new HttpError(409, 'Only published assessments can be assigned')

export const questionsUnavailable = (details) =>
  new HttpError(400, 'Some questions cannot be used', details)

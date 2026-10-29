import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const lessonNotFound = () => notFound('Lesson')

export const slugTaken = () => new HttpError(409, 'A lesson with this slug already exists')

export const onlyDraftsEditable = () => new HttpError(409, 'Only drafts can be edited. Create a new version first.')

export const onlyDraftsPublishable = () => new HttpError(409, 'Only drafts can be published')

export const noSteps = () => new HttpError(400, 'Add at least one step before publishing')

export const alreadyDraft = () => new HttpError(409, 'This version is already a draft')

export const draftExists = () => new HttpError(409, 'This lesson already has a draft. Edit that one instead.')

export const cannotRemove = () => new HttpError(409, 'Only drafts can be deleted and only published lessons can be archived')

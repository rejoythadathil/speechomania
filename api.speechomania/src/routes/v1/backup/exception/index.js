import { HttpError, notFound } from '../../../../../common-service/http/exception/index.js'

export const backupItemNotFound = () => notFound('Deleted item')

export const restoreParentFirst = () =>
  new HttpError(409, 'Restore this child’s parent first, from People in Backup')

export const restoreChildFirst = () =>
  new HttpError(409, 'Restore the child this note is about first, from Children in Backup')

export const draftExists = () =>
  new HttpError(409, 'This lesson already has a new draft. Delete or publish that draft first.')

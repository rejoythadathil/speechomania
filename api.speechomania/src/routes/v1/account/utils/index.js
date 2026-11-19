import { DELETION_REQUEST } from '../constants/index.js'

export const deletionOf = (metadata) => metadata?.[DELETION_REQUEST] ?? null

export const isPending = (metadata) => deletionOf(metadata)?.status === 'pending'

export const withDeletion = (metadata, request) => {
  const { [DELETION_REQUEST]: _previous, ...rest } = metadata ?? {}
  return request ? { ...rest, [DELETION_REQUEST]: request } : rest
}

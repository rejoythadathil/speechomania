export const PG_ERRORS = {
  23505: [409, 'This already exists'],
  23503: [409, 'This is still linked to other records'],
  23514: [400, 'One of the values is not allowed'],
  '22P02': [400, 'One of the values has the wrong format'],
  40001: [409, 'Someone else changed this at the same time. Try again.'],
  42501: [403, 'This action is not allowed']
}

export const SERIAL = { isolationLevel: 'Serializable' }

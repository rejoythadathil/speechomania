import Joi from 'joi'
import { CHILD_STATUSES } from '../../children/constants/index.js'
import { RESULT_STATUSES } from '../../assessments/constants/index.js'

export const childrenQuery = Joi.object({
  status: Joi.string().valid(...CHILD_STATUSES),
  unassigned: Joi.boolean(),
  q: Joi.string().trim().max(100).allow('')
})

export const resultsQuery = Joi.object({
  status: Joi.string().valid(...RESULT_STATUSES),
  q: Joi.string().trim().max(100).allow('')
})

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

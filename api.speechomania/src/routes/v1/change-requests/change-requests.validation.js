import Joi from 'joi'
import { pageQuery } from '../../../../utils.js'
import { REQUEST_STATUSES } from './change-requests.constant.js'

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...REQUEST_STATUSES),
  ...pageQuery
})

export const createBody = Joi.object({
  lesson_id: Joi.string().uuid().required(),
  reason: Joi.string().trim().min(1).max(2000).required(),
  proposed_change: Joi.object({
    summary: Joi.string().trim().min(1).max(4000).required(),
    step_index: Joi.number().integer().min(0)
  }).required()
})

export const reviewBody = Joi.object({
  decision: Joi.string().valid('approve', 'reject').required(),
  review_note: Joi.string().trim().max(2000).allow('').when('decision', {
    is: 'reject',
    then: Joi.string().min(1).required().messages({ 'any.required': 'Add a note explaining the rejection' })
  })
})

import Joi from 'joi'

export const deletionBody = Joi.object({
  reason: Joi.string().trim().max(500).allow('')
})

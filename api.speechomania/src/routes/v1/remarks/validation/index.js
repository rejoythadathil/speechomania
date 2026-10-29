import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'

export const pageOnly = Joi.object(pageQuery)

export const childParams = Joi.object({ childId: Joi.string().uuid().required() })
export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const createBody = Joi.object({
  body: Joi.string().trim().min(1).max(5000).required(),
  visibility: Joi.string().valid('internal', 'shared').default('internal'),
  metadata: Joi.object().unknown(true)
})

export const updateBody = Joi.object({
  body: Joi.string().trim().min(1).max(5000),
  visibility: Joi.string().valid('internal', 'shared')
}).min(1)

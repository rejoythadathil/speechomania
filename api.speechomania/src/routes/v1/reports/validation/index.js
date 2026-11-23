import Joi from 'joi'

export const childParams = Joi.object({ id: Joi.string().uuid().required() })

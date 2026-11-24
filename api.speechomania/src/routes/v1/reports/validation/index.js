import Joi from 'joi'

export const childParams = Joi.object({ id: Joi.string().uuid().required() })

export const lessonParams = Joi.object({
  id: Joi.string().uuid().required(),
  lessonId: Joi.string().uuid().required()
})

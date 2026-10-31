import Joi from 'joi'

export const profileBody = Joi.object({
  full_name: Joi.string().trim().min(1).max(120),
  phone: Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).allow(null, ''),
  avatar: Joi.string().pattern(/^[A-Za-z0-9-]{1,64}$/)
}).min(1)

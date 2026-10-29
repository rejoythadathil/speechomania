import Joi from 'joi'

export const searchQuery = Joi.object({ q: Joi.string().trim().min(1).max(100).required() })

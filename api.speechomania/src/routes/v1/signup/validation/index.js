import Joi from 'joi'

export const signupBody = Joi.object({
  child_name: Joi.string().trim().min(1).max(40).required(),
  consent_given: Joi.boolean()
    .valid(true)
    .required()
    .messages({ 'any.only': 'Parental consent is required' })
})

import Joi from 'joi'
import { pageQuery } from '../../../../utils.js'
import { CHILD_STATUSES } from './children.constant.js'

const sensorySettings = Joi.object({
  motion: Joi.string().valid('normal', 'reduced'),
  sound: Joi.string().valid('normal', 'quiet', 'off'),
  colour: Joi.string().valid('normal', 'low')
})
const dateOfBirth = Joi.date().iso().max('now').raw().allow(null)
const slug = Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...CHILD_STATUSES),
  mentor_id: Joi.string().uuid(),
  parent_id: Joi.string().uuid(),
  unassigned: Joi.boolean(),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const createBody = Joi.object({
  parent_id: Joi.string().uuid(),
  display_name: Joi.string().trim().min(1).max(80).required(),
  date_of_birth: dateOfBirth,
  avatar_key: Joi.string().max(300).allow(null, ''),
  sensory_settings: sensorySettings.default({ motion: 'reduced', sound: 'normal', colour: 'low' }),
  consent_given: Joi.boolean().valid(true).required().messages({ 'any.only': 'Parental consent is required' }),
  metadata: Joi.object().unknown(true)
})

export const updateBody = Joi.object({
  display_name: Joi.string().trim().min(1).max(80),
  date_of_birth: dateOfBirth,
  avatar_key: Joi.string().max(300).allow(null, ''),
  sensory_settings: sensorySettings,
  status: Joi.string().valid(...CHILD_STATUSES),
  metadata: Joi.object().unknown(true)
}).min(1)

export const mentorBody = Joi.object({ mentor_id: Joi.string().uuid().allow(null).required() })

export const lessonsBody = Joi.object({ slugs: Joi.array().items(slug).unique().max(200).required() })

import Joi from 'joi'
import { pageQuery } from '../../../../utils.js'
import { LESSON_STATUSES } from './lessons.constant.js'

const content = Joi.object({
  steps: Joi.array().items(Joi.object({
    text: Joi.string().trim().min(1).max(500).required(),
    image_key: Joi.string().max(300).allow(null, ''),
    audio_key: Joi.string().max(300).allow(null, '')
  })).max(100).required()
})

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...LESSON_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const createBody = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).required()
    .messages({ 'string.pattern.base': 'Use lowercase letters, numbers and single hyphens' }),
  title: Joi.string().trim().min(1).max(160).required(),
  content: content.default({ steps: [] }),
  metadata: Joi.object().unknown(true)
})

export const updateBody = Joi.object({
  title: Joi.string().trim().min(1).max(160),
  content,
  metadata: Joi.object().unknown(true)
}).min(1)

export const pageOnly = Joi.object(pageQuery)

import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import { LESSON_CHARACTERS } from '../../lessons/constants/index.js'
import { EVENT_STEPS } from '../constants/index.js'

export const childParams = Joi.object({ id: Joi.string().uuid().required() })

export const lessonParams = Joi.object({ id: Joi.string().uuid().required(), lessonId: Joi.string().uuid().required() })

export const attemptParams = Joi.object({ id: Joi.string().uuid().required() })

export const shelfQuery = Joi.object(pageQuery)

export const startBody = Joi.object({ lesson_id: Joi.string().uuid().required() })

export const progressBody = Joi.object({
  events: Joi.array().items(Joi.object({
    step: Joi.string().valid(...EVENT_STEPS).required(),
    index: Joi.number().integer().min(0).max(100).required(),
    choice: Joi.string().valid(...LESSON_CHARACTERS),
    correct: Joi.boolean().required(),
    wrongs: Joi.number().integer().min(0).max(20).default(0),
    latency_ms: Joi.number().integer().min(0).max(3600000).required()
  })).max(50).default([]),
  steps_completed: Joi.number().integer().min(0).max(200).required(),
  completed: Joi.boolean().default(false)
})

export const exitBody = Joi.object({ pin: Joi.string().pattern(/^\d{4}$/).allow(null, '') })

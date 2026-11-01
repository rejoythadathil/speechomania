import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import {
  ASSESSMENT_STATUSES,
  DEFAULT_SETTINGS,
  MAX_ITEMS,
  MAX_TRIES,
  RESULT_STATUSES
} from '../constants/index.js'

const points = Joi.number().integer().min(0).max(100)

const flags = (defaults) =>
  Joi.object(
    Object.fromEntries(
      Object.entries(defaults).map(([name, value]) => [name, Joi.boolean().default(value)])
    )
  ).default()

const settings = Joi.object({
  scoring: Joi.object({
    points: points.min(1).default(DEFAULT_SETTINGS.scoring.points),
    tries: Joi.number().integer().min(1).max(MAX_TRIES).default(DEFAULT_SETTINGS.scoring.tries),
    retry_points: points.default(DEFAULT_SETTINGS.scoring.retry_points),
    pass_percent: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .allow(null)
      .default(DEFAULT_SETTINGS.scoring.pass_percent)
  }).default(),
  play: flags(DEFAULT_SETTINGS.play),
  collect: flags(DEFAULT_SETTINGS.collect),
  visibility: flags(DEFAULT_SETTINGS.visibility)
}).custom((value, helpers) =>
  value.scoring.retry_points <= value.scoring.points
    ? value
    : helpers.message('Points for a later try cannot be more than points for a first try')
)

const items = Joi.array()
  .items(
    Joi.object({
      lesson_id: Joi.string().uuid().required(),
      step_index: Joi.number().integer().min(0).max(100).required(),
      points: points.min(1)
    })
  )
  .max(MAX_ITEMS)

const title = Joi.string().trim().min(1).max(160)

const description = Joi.string().trim().max(2000).allow(null, '')

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const childParams = Joi.object({ childId: Joi.string().uuid().required() })

export const assignmentParams = Joi.object({
  id: Joi.string().uuid().required(),
  childId: Joi.string().uuid().required()
})

export const attemptParams = Joi.object({ attemptId: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...ASSESSMENT_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const resultsQuery = Joi.object({
  status: Joi.string().valid(...RESULT_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const pageOnly = Joi.object(pageQuery)

export const createBody = Joi.object({
  title: title.required(),
  description,
  settings: settings.default(),
  items: items.default([])
})

export const updateBody = Joi.object({ title, description, settings, items }).min(1)

export const assignBody = Joi.object({
  child_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).unique().required(),
  due_on: Joi.date().iso().raw().allow(null)
})

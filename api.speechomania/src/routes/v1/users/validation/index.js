import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import { ROLES, USER_STATUSES } from '../constants/index.js'

const phone = Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).allow(null, '')
const metadata = Joi.object().unknown(true)

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid(...USER_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const createBody = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254).required(),
  full_name: Joi.string().trim().min(1).max(120).required(),
  phone,
  role: Joi.string().valid(...ROLES).required(),
  metadata
})

export const updateBody = Joi.object({
  full_name: Joi.string().trim().min(1).max(120),
  phone,
  status: Joi.string().valid('active', 'disabled'),
  metadata
}).min(1)

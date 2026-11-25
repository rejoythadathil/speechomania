import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import { BACKUP_TYPES, RETENTION_DAYS } from '../constants/index.js'

export const typeParams = Joi.object({
  type: Joi.string()
    .valid(...BACKUP_TYPES)
    .required()
})

export const itemParams = Joi.object({
  type: Joi.string()
    .valid(...BACKUP_TYPES)
    .required(),
  id: Joi.string().uuid().required()
})

export const listQuery = Joi.object(pageQuery)

export const settingsBody = Joi.object({
  retention_days: Joi.number()
    .valid(...RETENTION_DAYS)
    .required()
})

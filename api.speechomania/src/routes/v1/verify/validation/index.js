import Joi from 'joi'
import { CODE_PATTERN } from '../../../../../common-service/reports/constants/index.js'

const code = Joi.string().trim().uppercase().pattern(CODE_PATTERN)

export const codeParams = Joi.object({ code: code.required() })

export const fileBody = Joi.object({
  sha256: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[0-9a-f]{64}$/)
    .required(),
  code: code.allow(null, '')
})

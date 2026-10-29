import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'

export const followUpQuery = Joi.object(pageQuery)

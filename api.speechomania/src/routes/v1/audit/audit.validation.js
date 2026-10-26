import Joi from 'joi'
import { pageQuery } from '../../../../utils.js'

export const listQuery = Joi.object({
  entity_type: Joi.string().valid('user', 'child', 'lesson', 'remark', 'change_request'),
  entity_id: Joi.string().max(100),
  actor_id: Joi.string().uuid(),
  action: Joi.string().max(100),
  ...pageQuery
})

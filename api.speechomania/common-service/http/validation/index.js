import Joi from 'joi'
import { PAGE } from '../constants/index.js'

export const pageQuery = {
  page: Joi.number().integer().min(PAGE.first).max(PAGE.last).default(PAGE.first),
  page_size: Joi.number().integer().min(1).max(PAGE.maxSize).default(PAGE.defaultSize)
}

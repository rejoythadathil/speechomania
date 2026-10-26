import { Hono } from 'hono'
import Joi from 'joi'
import { validate } from '../../../middleware/validate.js'
import * as controller from './search.controller.js'

const searchQuery = Joi.object({ q: Joi.string().trim().min(1).max(100).required() })

export const searchRoute = new Hono().get('/', validate({ query: searchQuery }), controller.search)

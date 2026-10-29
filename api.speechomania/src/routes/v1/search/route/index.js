import { Hono } from 'hono'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { searchQuery } from '../validation/index.js'

export const searchRoute = new Hono().get('/', validate({ query: searchQuery }), controller.search)

import { Hono } from 'hono'
import { validate } from '../../../../middleware/validate.js'
import * as controller from '../controller/index.js'
import { freeParams, freeQuery, gamesQuery } from '../validation/index.js'

export const showcaseRoute = new Hono()
  .get('/', controller.summary)
  .get('/games', validate({ query: gamesQuery }), controller.games)
  .get('/free', validate({ query: freeQuery }), controller.freeGames)
  .get('/free/:slug', validate({ params: freeParams }), controller.freeGame)

import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import { LESSON_PLAYERS } from '../../lessons/constants/index.js'

const playerList = Joi.array()
  .items(Joi.string().valid(...LESSON_PLAYERS))
  .unique()

export const gamesQuery = Joi.object({
  ...pageQuery,
  players: Joi.string()
    .max(200)
    .custom((value, helpers) => {
      const list = value.split(',').filter(Boolean)
      const { error } = playerList.validate(list)
      return error ? helpers.error('any.invalid') : list
    })
})

export const freeQuery = Joi.object(pageQuery)

export const freeParams = Joi.object({
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .max(80)
    .required()
})

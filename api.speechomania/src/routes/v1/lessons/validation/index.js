import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import { LESSON_ACTIONS, LESSON_CHARACTERS, LESSON_LINES, LESSON_PLAYERS, LESSON_STATUSES } from '../constants/index.js'

const text = Joi.string().trim().min(1).max(500)

const audio = Joi.object({
  key: Joi.string().max(300).required(),
  duration: Joi.number().min(0).max(600).required(),
  words: Joi.array().items(Joi.object({
    word: Joi.string().max(100).required(),
    start: Joi.number().min(0).required(),
    end: Joi.number().min(0).required()
  })).max(300).required()
}).allow(null)

const line = Joi.object({ text: text.required(), audio })
const character = Joi.string().valid(...LESSON_CHARACTERS)

const storyStep = Joi.object({
  text: text.required(),
  image_key: Joi.string().max(300).allow(null, ''),
  audio_key: Joi.string().max(300).allow(null, ''),
  audio
})

const pickStep = storyStep.keys({
  choices: Joi.array().items(character).length(2).unique().required(),
  answer: character.required(),
  actor: character.required(),
  act: Joi.string().valid(...LESSON_ACTIONS).required(),
  praise: line.required(),
  teach: line.required()
}).custom((value, helpers) => {
  if (!value.choices.includes(value.answer)) return helpers.message('The answer must be one of the two pictures')
  if (!value.choices.includes(value.actor)) return helpers.message('The character who acts must be one of the two pictures')
  return value
})

const content = Joi.object({
  player: Joi.string().valid(...LESSON_PLAYERS).default('story'),
  contrast: Joi.string().trim().max(40),
  lines: Joi.object(Object.fromEntries(LESSON_LINES.map((name) => [name, line]))),
  steps: Joi.when('player', {
    is: 'pick',
    then: Joi.array().items(pickStep).max(100).required(),
    otherwise: Joi.array().items(storyStep).max(100).required()
  })
})

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...LESSON_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const createBody = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).required()
    .messages({ 'string.pattern.base': 'Use lowercase letters, numbers and single hyphens' }),
  title: Joi.string().trim().min(1).max(160).required(),
  content: content.default({ steps: [] }),
  metadata: Joi.object().unknown(true)
})

export const updateBody = Joi.object({
  title: Joi.string().trim().min(1).max(160),
  content,
  metadata: Joi.object().unknown(true)
}).min(1)

export const pageOnly = Joi.object(pageQuery)

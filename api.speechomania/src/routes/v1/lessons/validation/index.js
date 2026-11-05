import Joi from 'joi'
import { pageQuery } from '../../../../../common-service/http/validation/index.js'
import {
  ART_NAME,
  CHECK_OPTIONS,
  CHECK_QUESTIONS,
  CHOICE_PLAYERS,
  LESSON_ACTIONS,
  LESSON_CHARACTERS,
  LESSON_LINES,
  LESSON_PLAYERS,
  LESSON_STATUSES,
  MAX_ROUNDS,
  PAIRS_PER_BOARD,
  PICTURE_PLAYERS
} from '../constants/index.js'

const text = Joi.string().trim().min(1).max(500)

const audio = Joi.object({
  key: Joi.string().max(300).required(),
  duration: Joi.number().min(0).max(600).required(),
  words: Joi.array()
    .items(
      Joi.object({
        word: Joi.string().max(100).required(),
        start: Joi.number().min(0).required(),
        end: Joi.number().min(0).required()
      })
    )
    .max(300)
    .required()
}).allow(null)

const line = Joi.object({ text: text.required(), audio })
const character = Joi.string().valid(...LESSON_CHARACTERS)

const art = Joi.array().items(Joi.string().pattern(ART_NAME).max(40)).min(1).max(3)

const storyStep = Joi.object({
  text: text.required(),
  art,
  image_key: Joi.string().max(300).allow(null, ''),
  audio_key: Joi.string().max(300).allow(null, ''),
  audio
})

const pickStep = storyStep
  .keys({
    choices: Joi.array().items(character).length(2).unique().required(),
    answer: character.required(),
    actor: character.required(),
    act: Joi.string()
      .valid(...LESSON_ACTIONS)
      .required(),
    praise: line.required(),
    teach: line.required()
  })
  .custom((value, helpers) => {
    if (!value.choices.includes(value.answer))
      return helpers.message('The answer must be one of the two pictures')
    if (!value.choices.includes(value.actor))
      return helpers.message('The character who acts must be one of the two pictures')
    return value
  })

const word = Joi.string().trim().min(1).max(60)
const gameStep = storyStep.keys({ praise: line, sentence: line })

const pictureStep = gameStep.keys({ word: word.required() }).or('art', 'image_key')

const choiceStep = gameStep
  .keys({
    choices: Joi.array().items(word).min(2).max(4).unique().required(),
    answer: word.required(),
    first: word,
    second: word
  })
  .custom((value, helpers) =>
    value.choices.includes(value.answer)
      ? value
      : helpers.message('The answer must be one of the choices')
  )

const compareStep = choiceStep
  .keys({ art: art.required() })
  .custom((value, helpers) =>
    value.art.length === value.choices.length
      ? value
      : helpers.message('Give one picture for each choice')
  )

const placeStep = choiceStep.keys({ art: art.length(2).required() })

const matchStep = gameStep.keys({
  first: word.required(),
  second: word.required(),
  art: art.length(2).required()
})

const yesNoStep = gameStep.keys({ answer: Joi.boolean().required() }).or('art', 'image_key')

const stepsFor = (player) => {
  if (player === 'pick') return pickStep
  if (player === 'yesno') return yesNoStep
  if (player === 'match') return matchStep
  if (player === 'compare') return compareStep
  if (player === 'place') return placeStep
  if (PICTURE_PLAYERS.includes(player)) return pictureStep
  if (CHOICE_PLAYERS.includes(player)) return choiceStep
  return storyStep
}

const content = Joi.object({
  player: Joi.string()
    .valid(...LESSON_PLAYERS)
    .default('story'),
  contrast: Joi.string().trim().max(40),
  rounds: Joi.number().integer().min(1).max(MAX_ROUNDS),
  lines: Joi.object(Object.fromEntries(LESSON_LINES.map((name) => [name, line]))),
  steps: Joi.alternatives().conditional('player', {
    switch: LESSON_PLAYERS.map((player) => ({
      is: player,
      then: Joi.array().items(stepsFor(player)).max(100).required()
    })),
    otherwise: Joi.array().items(storyStep).max(100).required()
  })
}).custom((value, helpers) => {
  if (PICTURE_PLAYERS.includes(value.player) && value.steps.length && value.steps.length < 3)
    return helpers.message('This game needs at least three pictures')
  if (value.player === 'match' && value.steps.length && value.steps.length < PAIRS_PER_BOARD)
    return helpers.message(`A memory game needs at least ${PAIRS_PER_BOARD} pairs`)
  return value
})

export const idParams = Joi.object({ id: Joi.string().uuid().required() })

export const listQuery = Joi.object({
  status: Joi.string().valid(...LESSON_STATUSES),
  q: Joi.string().trim().max(100).allow(''),
  ...pageQuery
})

export const createBody = Joi.object({
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80)
    .required()
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

export const checkBody = Joi.object({
  enabled: Joi.boolean().required(),
  questions: Joi.number()
    .integer()
    .valid(...CHECK_OPTIONS)
    .default(CHECK_QUESTIONS)
})

import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

export const child = async (c) =>
  c.json(await service.getLearner(c.get('user'), c.get('valid').params.id))

export async function shelf(c) {
  const { params, query } = c.get('valid')
  return c.json(await service.listShelf(c.get('user'), params.id, query))
}

export async function lesson(c) {
  const { params } = c.get('valid')
  return c.json(await service.getPlayableLesson(c.get('user'), params.id, params.lessonId))
}

export async function start(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.startAttempt(c.get('user'), params.id, body, requestCtx(c)), 201)
}

export async function assessments(c) {
  const { params, query } = c.get('valid')
  return c.json(await service.listLearnerAssessments(c.get('user'), params.id, query))
}

export async function assessment(c) {
  const { params } = c.get('valid')
  return c.json(await service.getPlayableAssessment(c.get('user'), params.id, params.assessmentId))
}

export async function progress(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.recordProgress(c.get('user'), params.id, body, requestCtx(c)))
}

export async function exit(c) {
  const { params, body } = c.get('valid')
  return c.json(await service.exitLearning(c.get('user'), params.id, body.pin))
}

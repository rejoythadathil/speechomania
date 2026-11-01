import { requestCtx } from '../../../../../common-service/http/utils/index.js'
import * as service from '../service/index.js'

const user = (c) => c.get('user')
const valid = (c) => c.get('valid')

export const list = async (c) => c.json(await service.listAssessments(user(c), valid(c).query))

export const get = async (c) => c.json(await service.getAssessment(user(c), valid(c).params.id))

export const create = async (c) =>
  c.json(await service.createAssessment(user(c), valid(c).body, requestCtx(c)), 201)

export const update = async (c) =>
  c.json(await service.updateAssessment(user(c), valid(c).params.id, valid(c).body, requestCtx(c)))

export const publish = async (c) =>
  c.json(await service.publishAssessment(user(c), valid(c).params.id, requestCtx(c)))

export async function remove(c) {
  await service.removeAssessment(user(c), valid(c).params.id, requestCtx(c))
  return c.body(null, 204)
}

export const assign = async (c) =>
  c.json(await service.assignAssessment(user(c), valid(c).params.id, valid(c).body, requestCtx(c)))

export async function unassign(c) {
  const { id, childId } = valid(c).params
  await service.unassignAssessment(user(c), id, childId, requestCtx(c))
  return c.body(null, 204)
}

export const results = async (c) =>
  c.json(await service.listResults(user(c), valid(c).params.id, valid(c).query))

export const summary = async (c) => c.json(await service.resultSummary(user(c), valid(c).params.id))

export const forChild = async (c) =>
  c.json(await service.listForChild(user(c), valid(c).params.childId, valid(c).query))

export const attempt = async (c) =>
  c.json(await service.getAttemptResult(user(c), valid(c).params.attemptId))

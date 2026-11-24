import {
  artImages,
  issuePdf,
  limitExports,
  renderTemplate
} from '../../../../../common-service/reports/service/index.js'
import { everyRow, reportFileName } from '../../../../../common-service/reports/utils/index.js'
import { listForChild as listAssessments } from '../../assessments/service/index.js'
import { getLearner, getPlayableLesson, listShelf } from '../../learning/service/index.js'
import { listForChild as listRemarks } from '../../remarks/service/index.js'
import { notFlashcards } from '../exception/index.js'
import { cardsData, progressData } from '../utils/index.js'

export async function progressDocument(user, childId) {
  const learner = await getLearner(user, childId)
  const [lessons, assessments, remarks] = await Promise.all([
    everyRow((page, size) => listShelf(user, childId, { show: 'all', page, page_size: size })),
    everyRow((page, size) => listAssessments(user, childId, { page, page_size: size })),
    listRemarks(user, childId, { page: 1, page_size: 20 }).then((page) => page.items)
  ])
  const data = progressData({
    learner,
    lessons,
    assessments,
    remarks,
    parentName: user.full_name,
    today: new Date()
  })
  return {
    definition: renderTemplate('progress-report', data),
    data,
    counts: { lessons: lessons.length, assessments: assessments.length, remarks: remarks.length },
    fileName: reportFileName('progress', [learner.display_name], 'pdf')
  }
}

export async function cardsDocument(user, childId, lessonId) {
  const [learner, lesson] = await Promise.all([
    getLearner(user, childId),
    getPlayableLesson(user, childId, lessonId)
  ])
  if (lesson.content.player !== 'cards') throw notFlashcards()
  const names = (lesson.content.steps ?? []).flatMap((step) => step.art ?? [])
  const images = artImages(names)
  const data = cardsData({
    learner,
    lesson,
    parentName: user.full_name,
    today: new Date(),
    hasArt: (name) => Boolean(images[name])
  })
  return {
    definition: { ...renderTemplate('lesson-cards', data), images },
    data,
    counts: { lesson: lesson.slug, cards: data.cards.length },
    fileName: reportFileName('flashcards', [learner.display_name, data.lesson.title], 'pdf')
  }
}

async function issue(user, childId, kind, report, ctx) {
  await limitExports(user)
  const { body } = await issuePdf({
    definition: report.definition,
    kind,
    owner: user.full_name,
    user,
    entityId: childId,
    diff: report.counts,
    ctx
  })
  return { body, fileName: report.fileName }
}

export async function progressReport(user, childId, ctx) {
  return issue(user, childId, 'progress', await progressDocument(user, childId), ctx)
}

export async function lessonCards(user, childId, lessonId, ctx) {
  return issue(user, childId, 'cards', await cardsDocument(user, childId, lessonId), ctx)
}

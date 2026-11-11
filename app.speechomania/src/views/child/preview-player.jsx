import { useCallback, useMemo } from 'react'
import { PreviewStage } from '@/layout/learning-layout/preview-stage.jsx'
import { ASSESSMENT_LINES, assessmentCover } from './assessment-player.jsx'
import { checkScore, lessonCover } from './lesson-player.jsx'
import { LINES, PlaySession, assessmentPages, lessonPages } from './play-session.jsx'

const nothing = () => Promise.resolve(null)

function tally(saved, answers) {
  const scored = answers.filter((event) => event.step === 'play' || event.step === 'check')
  return {
    got: scored.filter((event) => event.correct && !event.wrongs).length,
    total: scored.length,
    check: checkScore(answers)
  }
}

export function LessonPreview({
  lesson,
  onClose,
  kicker = 'Preview',
  leaveLabel = 'Close preview'
}) {
  const lines = useMemo(() => ({ ...LINES, ...lesson.content.lines }), [lesson.content.lines])
  const plan = useCallback(
    () => lessonPages(lesson.content, lines, { cards: lesson.cards, check: lesson.check }),
    [lesson.cards, lesson.check, lesson.content, lines]
  )
  return (
    <PreviewStage onClose={onClose}>
      {(stage) => (
        <PlaySession
          {...stage}
          title={lesson.title}
          kicker={kicker}
          cover={lessonCover(lesson, lines)}
          lines={lines}
          plan={plan}
          start={nothing}
          send={nothing}
          summarise={tally}
          onLeave={onClose}
          leaveLabel={leaveLabel}
        />
      )}
    </PreviewStage>
  )
}

export function AssessmentPreview({ assessment, onClose }) {
  const settings = {
    tries: assessment.settings.scoring.tries,
    hints: assessment.settings.play.hints,
    shuffle: assessment.settings.play.shuffle
  }
  const plan = () => assessmentPages(assessment.items, settings)
  return (
    <PreviewStage onClose={onClose}>
      {(stage) => (
        <PlaySession
          {...stage}
          title={assessment.title}
          kicker="Preview"
          cover={assessmentCover(assessment)}
          lines={ASSESSMENT_LINES}
          plan={plan}
          start={nothing}
          send={nothing}
          summarise={tally}
          onLeave={onClose}
          leaveLabel="Close preview"
        />
      )}
    </PreviewStage>
  )
}

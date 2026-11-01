import { useCallback, useMemo } from 'react'
import { PreviewStage } from '@/layout/learning-layout/preview-stage.jsx'
import { ASSESSMENT_LINES, assessmentCover } from './assessment-player.jsx'
import { lessonCover } from './lesson-player.jsx'
import { LINES, PlaySession, assessmentPages, lessonPages } from './play-session.jsx'

const nothing = () => Promise.resolve(null)

function tally(saved, answers) {
  const scored = answers.filter((event) => event.step !== 'learn' && event.step !== 'story')
  return {
    got: scored.filter((event) => event.correct && !event.wrongs).length,
    total: scored.length
  }
}

export function LessonPreview({ lesson, onClose }) {
  const lines = useMemo(() => ({ ...LINES, ...lesson.content.lines }), [lesson.content.lines])
  const plan = useCallback(() => lessonPages(lesson.content, lines), [lesson.content, lines])
  return (
    <PreviewStage onClose={onClose}>
      {(stage) => (
        <PlaySession
          {...stage}
          title={lesson.title}
          kicker="Preview"
          cover={lessonCover(lesson, lines)}
          lines={lines}
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

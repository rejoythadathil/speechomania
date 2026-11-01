import { useCallback } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { useResource } from '@/hooks/use-resource.js'
import { api } from '@/services/api.js'
import { PlayLoading, useAttempt } from './lesson-player.jsx'
import { LINES, PlaySession, assessmentPages } from './play-session.jsx'

export const ASSESSMENT_LINES = { ...LINES, outro: { text: 'All done. Great work!' }, reward: null }

export function assessmentCover(assessment) {
  return {
    player: assessment.items[0]?.player ?? 'story',
    art: ['clipboard', 'star'],
    intro: `${assessment.items.length} questions. Take your time.`,
    how: [
      ['speaker', 'Listen'],
      ['eyes', 'Look'],
      ['raised-hand', 'Tap your answer']
    ]
  }
}

function Player({ assessment, learner, voice, bar, celebrate }) {
  const navigate = useNavigate()
  const start = useCallback(
    () =>
      api(`/learning/children/${learner.id}/attempts`, {
        method: 'POST',
        body: { assessment_id: assessment.id }
      }),
    [assessment.id, learner.id]
  )
  const attempt = useAttempt(start)
  const summarise = useCallback(
    (saved) =>
      saved?.result
        ? { got: saved.result.score, total: saved.result.max_score, again: false }
        : { again: false },
    []
  )

  return (
    <PlaySession
      title={assessment.title}
      kicker={assessment.title}
      cover={assessmentCover(assessment)}
      lines={ASSESSMENT_LINES}
      plan={() => assessmentPages(assessment.items, assessment.settings)}
      start={attempt.open}
      send={attempt.send}
      summarise={summarise}
      onLeave={() => navigate(`/learn/${learner.id}`)}
      leaveLabel="My games"
      voice={voice}
      bar={bar}
      celebrate={celebrate}
    />
  )
}

export function AssessmentPlayerView() {
  const { learner, voice, bar, celebrate, reloadLearner } = useOutletContext()
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const assessment = useResource(`/learning/children/${learner.id}/assessments/${assessmentId}`)
  const back = () => {
    reloadLearner()
    navigate(`/learn/${learner.id}`)
  }

  if (!assessment.data) {
    return (
      <PlayLoading
        bar={bar}
        error={assessment.error}
        missing="This check-in isn’t ready."
        onBack={back}
      />
    )
  }
  return (
    <Player
      key={assessment.data.id}
      assessment={assessment.data}
      learner={learner}
      voice={voice}
      bar={bar}
      celebrate={celebrate}
    />
  )
}

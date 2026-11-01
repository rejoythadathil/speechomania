import { useState } from 'react'
import { Chip } from '@/components/base/badges/chip'
import { ACTION_ART, ART, Art } from '@/components/child/art.jsx'
import { GameThumb } from '@/components/child/game-thumb.jsx'
import { sceneFor } from '@/components/child/scenes.js'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Panel } from '@/components/shared/panel.jsx'

const STEPS_PER_PAGE = 12
const PAIRS_PER_BOARD = 3

const LINE_LABELS = {
  intro: 'Start',
  quiz: 'Question time',
  retry: 'After a wrong answer',
  skip: 'Moving on',
  yes: 'Right answer',
  outro: 'End',
  reward: 'Reward'
}

const playerOf = (content) => content.player ?? 'story'

export function roundsLabel(content) {
  const player = playerOf(content)
  const steps = content.steps?.length ?? 0
  if (player === 'story') return `${steps} pages`
  if (player === 'pick') return `${steps} questions`
  const pool = player === 'match' ? Math.floor(steps / PAIRS_PER_BOARD) : steps
  const rounds = Math.min(content.rounds ?? pool, pool)
  const unit = player === 'match' ? 'boards' : 'rounds'
  return rounds < pool ? `${rounds} ${unit} picked from ${pool}` : `${rounds} ${unit}`
}

function Voice({ line }) {
  return (
    <Chip variant="caption" color={line?.audio?.key ? 'cyan' : 'neutral'}>
      {line?.audio?.key ? 'Voice ready' : 'No voice yet'}
    </Chip>
  )
}

function Said({ label, line }) {
  if (!line?.text) return null
  return (
    <p className="flex flex-wrap items-baseline gap-1.5 text-body-2-regular text-text-secondary">
      <span className="text-caption-1-semibold text-text-tertiary uppercase">{label}</span>
      <span className="text-text-primary">“{line.text}”</span>
    </p>
  )
}

function Picture({ name, label, right }) {
  return (
    <figure
      className={`flex w-20 flex-col items-center gap-1 rounded-lg border p-1.5 ${right ? 'border-accent-500 bg-accent-50' : 'border-[var(--line)]'}`}
    >
      {ART[name] ? <Art name={name} className="size-12" /> : <span className="size-12" />}
      {label ? (
        <figcaption className="text-center text-caption-1-medium text-text-secondary">
          {label}
        </figcaption>
      ) : null}
    </figure>
  )
}

function Choices({ choices, answer }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {choices.map((choice) => (
        <Chip key={choice} variant="caption" color={choice === answer ? 'lime' : 'neutral'}>
          {choice === answer ? `✓ ${choice}` : choice}
        </Chip>
      ))}
    </div>
  )
}

function StepBody({ player, step }) {
  if (player === 'pick') {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {step.choices.map((name) => (
            <Picture
              key={name}
              name={name}
              label={name === step.answer ? `${name} (answer)` : name}
              right={name === step.answer}
            />
          ))}
          {ACTION_ART[step.act] ? (
            <Picture name={ACTION_ART[step.act]} label={`${step.actor} acts: ${step.act}`} />
          ) : null}
        </div>
        <Said label="Praise" line={step.praise} />
        <Said label="Teach" line={step.teach} />
      </>
    )
  }
  if (player === 'compare') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {step.choices.map((choice, index) => (
          <Picture
            key={choice}
            name={step.art[index]}
            label={choice}
            right={choice === step.answer}
          />
        ))}
      </div>
    )
  }
  if (player === 'match') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Picture name={step.art[0]} label={step.first} />
        <Picture name={step.art[1]} label={step.second} />
      </div>
    )
  }
  if (player === 'place') {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          <Picture name={step.art[0]} label="Move this" />
          <Picture name={step.art[1]} label="Spot" />
        </div>
        <Choices choices={step.choices} answer={step.answer} />
      </>
    )
  }
  return (
    <>
      {step.art?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {step.art.map((name, index) => (
            <Picture key={`${name}-${index}`} name={name} />
          ))}
        </div>
      ) : null}
      {step.image_url ? (
        <img
          src={step.image_url}
          alt=""
          className="h-20 w-auto rounded-lg border border-[var(--line)]"
        />
      ) : null}
      {player === 'squish' ? (
        <p className="text-body-2-regular text-text-secondary">
          {step.first} + {step.second}
        </p>
      ) : null}
      {step.word ? <Choices choices={[step.word]} answer={step.word} /> : null}
      {step.choices ? <Choices choices={step.choices} answer={step.answer} /> : null}
      {typeof step.answer === 'boolean' ? (
        <Choices choices={['Yes', 'No']} answer={step.answer ? 'Yes' : 'No'} />
      ) : null}
    </>
  )
}

export function StepCard({ player, step, index }) {
  return (
    <li className="inset flex flex-col gap-2 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-start gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-50 text-caption-1-semibold text-accent-700">
            {index + 1}
          </span>
          <span className="text-body-medium text-text-primary">{step.text}</span>
        </span>
        <Voice line={step} />
      </div>
      <StepBody player={player} step={step} />
      {player === 'pick' ? null : (
        <Said
          label={player === 'story' ? 'Says' : 'Then says'}
          line={step.praise ?? step.sentence}
        />
      )}
    </li>
  )
}

export function GamePanel({ lesson }) {
  const player = playerOf(lesson.content)
  const scene = sceneFor(player)
  return (
    <Panel title="Game" description={roundsLabel(lesson.content)}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-48 shrink-0">
          <GameThumb
            player={player}
            cover={player === 'pick' ? lesson.content.steps?.[0]?.choices : null}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-title-3-semibold text-text-primary">{scene.tag}</span>
          {lesson.content.contrast ? (
            <p className="text-body-2-regular text-text-secondary">
              Focus word: {lesson.content.contrast}
            </p>
          ) : null}
          <ol className="flex flex-wrap gap-2">
            {scene.how.map(([art, label], index) => (
              <li
                key={label}
                className="inset flex items-center gap-1.5 px-2 py-1 text-body-2-medium text-text-secondary"
              >
                <Art name={art} className="size-5" />
                {index + 1}. {label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Panel>
  )
}

export function LinesPanel({ lesson }) {
  const lines = Object.entries(LINE_LABELS).filter(([name]) => lesson.content.lines?.[name]?.text)
  return (
    <Panel title="Spoken lines" description="What the voice says around the rounds">
      {lines.length ? (
        <ul className="hairlines flex flex-col">
          {lines.map(([name, label]) => (
            <li
              key={name}
              className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0"
            >
              <span className="flex flex-col">
                <span className="text-caption-1-semibold text-text-tertiary uppercase">
                  {label}
                </span>
                <span className="text-body-2-regular text-text-primary">
                  “{lesson.content.lines[name].text}”
                </span>
              </span>
              <Voice line={lesson.content.lines[name]} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-2-regular text-text-tertiary">
          This lesson has no extra spoken lines.
        </p>
      )}
    </Panel>
  )
}

export function StepsPanel({ lesson }) {
  const [page, setPage] = useState(1)
  const player = playerOf(lesson.content)
  const steps = lesson.content.steps ?? []
  const start = (page - 1) * STEPS_PER_PAGE
  const data = {
    items: steps.slice(start, start + STEPS_PER_PAGE),
    page,
    page_size: STEPS_PER_PAGE,
    total: steps.length,
    total_pages: Math.max(1, Math.ceil(steps.length / STEPS_PER_PAGE))
  }
  const noun =
    player === 'story'
      ? 'pages'
      : player === 'match'
        ? 'pairs'
        : player === 'pick'
          ? 'questions'
          : 'pictures'
  return (
    <Panel
      title={player === 'story' ? 'Pages' : player === 'pick' ? 'Questions' : 'Rounds'}
      description={
        player === 'story'
          ? 'Read in this order'
          : player === 'match'
            ? `Cards come in boards of ${PAIRS_PER_BOARD} pairs`
            : player === 'pick'
              ? 'Asked in this order; the right answer is highlighted'
              : 'Each round is picked from this set; the right answer is highlighted'
      }
      footer={<ListFooter data={data} page={page} onPage={setPage} noun={noun} />}
    >
      {steps.length ? (
        <ol className="grid gap-2 md:grid-cols-2">
          {data.items.map((step, offset) => (
            <StepCard key={start + offset} player={player} step={step} index={start + offset} />
          ))}
        </ol>
      ) : (
        <p className="text-body-2-regular text-text-tertiary">No steps yet.</p>
      )}
    </Panel>
  )
}

export function GameTag({ player, cover }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-14 shrink-0">
        <GameThumb player={player ?? 'story'} cover={cover} />
      </span>
      <span className="text-body-2-medium text-text-secondary">{sceneFor(player).tag}</span>
    </span>
  )
}

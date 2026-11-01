import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiDeleteBinLine,
  RiSearchLine
} from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { IconButton } from '@/components/base/buttons/icon-button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Input } from '@/components/base/input/input'
import { sceneFor } from '@/components/child/scenes.js'
import { DataState } from '@/components/shared/data-state.jsx'
import { ListFooter } from '@/components/shared/list-footer.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { Panel } from '@/components/shared/panel.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'
import { GameTag, StepCard } from './lesson-content.jsx'

export const ASSESSABLE_PLAYERS = [
  'pick',
  'shark',
  'balloons',
  'bubbles',
  'squish',
  'compare',
  'place',
  'train',
  'yesno',
  'why'
]

const LESSONS_PER_PAGE = 8
const QUESTIONS_PER_PAGE = 10

const answerOf = (step) => {
  if (typeof step.answer === 'boolean') return step.answer ? 'Yes' : 'No'
  return step.answer ?? step.word ?? ''
}

export const keyOf = (item) => `${item.lesson_id}:${item.step_index}`

function LessonQuestions({ lessonId, taken, picked, onToggle }) {
  const lesson = useResource(`/lessons/${lessonId}`)
  const [page, setPage] = useState(1)
  const player = lesson.data?.content.player ?? 'story'
  const steps = lesson.data?.content.steps ?? []
  const start = (page - 1) * QUESTIONS_PER_PAGE
  const data = {
    items: steps.slice(start, start + QUESTIONS_PER_PAGE),
    page,
    page_size: QUESTIONS_PER_PAGE,
    total: steps.length,
    total_pages: Math.max(1, Math.ceil(steps.length / QUESTIONS_PER_PAGE))
  }

  return (
    <DataState
      loading={lesson.loading && !lesson.data}
      error={lesson.error}
      onRetry={lesson.reload}
    >
      {lesson.data ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-medium text-text-primary">{lesson.data.title}</span>
            <GameTag player={player} />
          </div>
          {ASSESSABLE_PLAYERS.includes(player) ? (
            <>
              <ul className="hairlines flex flex-col">
                {data.items.map((step, offset) => {
                  const item = { lesson_id: lesson.data.id, step_index: start + offset }
                  const key = keyOf(item)
                  return (
                    <li key={key} className="py-1.5">
                      <Checkbox
                        isSelected={taken.has(key) || picked.has(key)}
                        isDisabled={taken.has(key)}
                        onChange={(on) =>
                          onToggle({ ...item, lesson_title: lesson.data.title, player, step }, on)
                        }
                      >
                        <span className="flex flex-col">
                          <span className="text-body-2-medium text-text-primary">{step.text}</span>
                          <span className="text-caption-1-medium text-text-tertiary">
                            Answer: {answerOf(step)}
                            {taken.has(key) ? ' · already added' : ''}
                          </span>
                        </span>
                      </Checkbox>
                    </li>
                  )
                })}
              </ul>
              <ListFooter data={data} page={page} onPage={setPage} noun="questions" />
            </>
          ) : (
            <p className="text-body-2-regular text-text-tertiary">
              {sceneFor(player).tag} has no single question to score. Pick a lesson with a different
              game.
            </p>
          )}
        </div>
      ) : null}
    </DataState>
  )
}

function QuestionPicker({ taken, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lessonId, setLessonId] = useState(null)
  const [picked, setPicked] = useState(() => new Map())
  const q = useDebounced(search)
  const lessons = useResource('/lessons', {
    status: 'published',
    q,
    page,
    page_size: LESSONS_PER_PAGE
  })

  function toggle(item, on) {
    setPicked((current) => {
      const next = new Map(current)
      if (on) next.set(keyOf(item), item)
      else next.delete(keyOf(item))
      return next
    })
  }

  return (
    <Modal
      isOpen
      size="wide"
      onOpenChange={onClose}
      title="Add questions"
      description="Choose a published lesson, then tick the questions to copy into this assessment."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!picked.size}
            onClick={() => {
              onAdd([...picked.values()])
              onClose()
            }}
          >
            {picked.size
              ? `Add ${picked.size} ${picked.size === 1 ? 'question' : 'questions'}`
              : 'Add questions'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-2">
          <Input
            size="small"
            aria-label="Search lessons"
            placeholder="Search lessons"
            leadingIcon={RiSearchLine}
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
          <DataState
            loading={lessons.loading && !lessons.data}
            error={lessons.error}
            onRetry={lessons.reload}
          >
            <ul className="flex flex-col gap-1">
              {(lessons.data?.items ?? []).map((lesson) => (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setLessonId(lesson.id)}
                    className={cx(
                      'flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left',
                      lesson.id === lessonId
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-[var(--line)] hover:bg-[var(--surface-muted)]'
                    )}
                  >
                    <span className="text-body-2-medium text-text-primary">{lesson.title}</span>
                    <GameTag player={lesson.player} />
                  </button>
                </li>
              ))}
            </ul>
            <ListFooter data={lessons.data} page={page} onPage={setPage} noun="lessons" />
          </DataState>
        </div>
        <div className="inset min-h-64 p-2.5">
          {lessonId ? (
            <LessonQuestions
              key={lessonId}
              lessonId={lessonId}
              taken={taken}
              picked={picked}
              onToggle={toggle}
            />
          ) : (
            <p className="text-body-2-regular text-text-tertiary">
              Pick a lesson to see its questions.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function QuestionsEditor({ items, defaultPoints, onChange }) {
  const [picking, setPicking] = useState(false)
  const taken = new Set(items.map(keyOf))

  const move = (index, delta) => {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  const setPoints = (index, text) => {
    const number = Number.parseInt(text, 10)
    onChange(
      items.map((item, at) =>
        at === index
          ? {
              ...item,
              points: Number.isNaN(number) ? undefined : Math.min(100, Math.max(1, number))
            }
          : item
      )
    )
  }

  return (
    <Panel
      title="Questions"
      description="Copied from the lessons when the draft is saved. Later lesson edits do not change them."
      actions={
        <Button
          variant="secondary"
          size="small"
          leadingIcon={RiAddLine}
          onClick={() => setPicking(true)}
        >
          Add questions
        </Button>
      }
    >
      {items.length ? (
        <ol className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={keyOf(item)} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <ul>
                  <StepCard player={item.player} step={item.step} index={index} />
                </ul>
                <p className="mt-1 text-caption-1-medium text-text-tertiary">
                  From {item.lesson_title}
                </p>
              </div>
              <div className="flex w-24 shrink-0 flex-col gap-1">
                <Input
                  size="small"
                  type="number"
                  aria-label={`Points for question ${index + 1}`}
                  placeholder={`${defaultPoints} pts`}
                  value={item.points ? String(item.points) : ''}
                  onChange={(text) => setPoints(index, text)}
                />
                <span className="flex gap-1">
                  <IconButton
                    size="small"
                    icon={RiArrowUpLine}
                    aria-label={`Move question ${index + 1} up`}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  />
                  <IconButton
                    size="small"
                    icon={RiArrowDownLine}
                    aria-label={`Move question ${index + 1} down`}
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                  />
                  <IconButton
                    size="small"
                    icon={RiDeleteBinLine}
                    aria-label={`Remove question ${index + 1}`}
                    onClick={() => onChange(items.filter((_, at) => at !== index))}
                  />
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-body-2-regular text-text-tertiary">
          No questions yet. Add some from your published lessons.
        </p>
      )}
      {picking ? (
        <QuestionPicker
          taken={taken}
          onAdd={(added) => onChange([...items, ...added])}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </Panel>
  )
}

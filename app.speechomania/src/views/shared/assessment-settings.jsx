import { Input } from '@/components/base/input/input'
import { Switch } from '@/components/base/switch/switch'
import { Panel } from '@/components/shared/panel.jsx'

const NUMBERS = [
  { group: 'scoring', name: 'points', label: 'Points for a right first answer', min: 1, max: 100 },
  { group: 'scoring', name: 'tries', label: 'Tries per question', min: 1, max: 3 },
  {
    group: 'scoring',
    name: 'retry_points',
    label: 'Points for a right later try',
    min: 0,
    max: 100
  },
  {
    group: 'scoring',
    name: 'pass_percent',
    label: 'Pass mark (%)',
    min: 0,
    max: 100,
    optional: true
  }
]

const FLAGS = [
  {
    title: 'Play',
    group: 'play',
    items: [
      ['shuffle', 'Shuffle the questions'],
      ['hints', 'Glow the right answer after a wrong try'],
      ['retakes', 'Allow playing again after finishing']
    ]
  },
  {
    title: 'Data collected',
    group: 'collect',
    items: [
      ['answers', 'Which answer was tapped'],
      ['time', 'Time taken per question'],
      ['tries', 'Wrong tries before the answer']
    ]
  },
  {
    title: 'Who sees the score',
    group: 'visibility',
    items: [
      ['parent_score', 'Parents'],
      ['child_score', 'The child, on the last screen']
    ]
  }
]

function shown(value, optional) {
  if (value === null || value === undefined) return optional ? 'None' : '—'
  return String(value)
}

export function SettingsPanel({ settings, onChange }) {
  const editable = Boolean(onChange)

  function set(group, name, value) {
    onChange({ ...settings, [group]: { ...settings[group], [name]: value } })
  }

  function setNumber(field, text) {
    if (text === '' && field.optional) return set(field.group, field.name, null)
    const number = Number.parseInt(text, 10)
    if (Number.isNaN(number)) return
    set(field.group, field.name, Math.min(field.max, Math.max(field.min, number)))
  }

  return (
    <Panel
      title="Settings"
      description={
        editable
          ? 'Saved with the draft. Fixed once published.'
          : 'Fixed when the assessment was published'
      }
    >
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-caption-1-semibold text-text-tertiary uppercase">Scoring</h3>
          {NUMBERS.map((field) =>
            editable ? (
              <Input
                key={field.name}
                size="small"
                type="number"
                label={field.label}
                value={
                  settings[field.group][field.name] === null
                    ? ''
                    : String(settings[field.group][field.name])
                }
                placeholder={field.optional ? 'No pass mark' : undefined}
                onChange={(text) => setNumber(field, text)}
              />
            ) : (
              <p
                key={field.name}
                className="flex items-center justify-between gap-2 text-body-2-regular"
              >
                <span className="text-text-secondary">{field.label}</span>
                <span className="text-text-primary tabular-nums">
                  {shown(settings[field.group][field.name], field.optional)}
                </span>
              </p>
            )
          )}
        </section>
        {FLAGS.map((section) => (
          <section
            key={section.group}
            className="flex flex-col gap-2 border-t border-[var(--line)] pt-3"
          >
            <h3 className="text-caption-1-semibold text-text-tertiary uppercase">
              {section.title}
            </h3>
            {section.items.map(([name, label]) => (
              <Switch
                key={name}
                size="sm"
                isSelected={settings[section.group][name]}
                isDisabled={!editable}
                onChange={(value) => set(section.group, name, value)}
              >
                {label}
              </Switch>
            ))}
          </section>
        ))}
        <p className="text-caption-1-medium text-text-tertiary">
          Whether each answer was right is always kept, because the score needs it.
        </p>
      </div>
    </Panel>
  )
}

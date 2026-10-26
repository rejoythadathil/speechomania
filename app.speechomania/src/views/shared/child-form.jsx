import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Input } from '@/components/base/input/input'
import { FormAlert } from '@/components/shared/form-alert.jsx'
import { Modal } from '@/components/shared/modal.jsx'
import { PersonPicker } from '@/components/shared/person-picker.jsx'
import { SelectField } from '@/components/shared/select-field.jsx'
import { useAuth } from '@/hooks/use-auth.jsx'
import { api, fieldErrors } from '@/services/api.js'

const SENSORY_OPTIONS = {
  motion: [{ id: 'reduced', label: 'Reduced motion' }, { id: 'normal', label: 'Normal motion' }],
  sound: [{ id: 'normal', label: 'Normal' }, { id: 'quiet', label: 'Quiet' }, { id: 'off', label: 'Off' }],
  colour: [{ id: 'low', label: 'Soft colours' }, { id: 'normal', label: 'Full colours' }]
}

export function SensoryFields({ value, onChange }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next })
  return (
    <fieldset className="grid gap-2.5 sm:grid-cols-3">
      <legend className="mb-2 text-body-medium text-text-primary">Sensory settings</legend>
      <SelectField label="Motion" options={SENSORY_OPTIONS.motion} value={value.motion} onChange={set('motion')} />
      <SelectField label="Sound" options={SENSORY_OPTIONS.sound} value={value.sound} onChange={set('sound')} />
      <SelectField label="Colour" options={SENSORY_OPTIONS.colour} value={value.colour} onChange={set('colour')} />
    </fieldset>
  )
}

export function ChildFormModal({ isOpen, onOpenChange, child, onSaved }) {
  const { user } = useAuth()
  const editing = Boolean(child)
  const choosingParent = user.role === 'admin' && !editing
  const [form, setForm] = useState(() => ({
    display_name: child?.display_name ?? '',
    date_of_birth: child?.date_of_birth ?? '',
    parent_id: null,
    sensory_settings: child?.sensory_settings ?? { motion: 'reduced', sound: 'normal', colour: 'low' },
    consent_given: false
  }))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const errors = fieldErrors(error)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const body = {
      display_name: form.display_name,
      date_of_birth: form.date_of_birth || null,
      sensory_settings: form.sensory_settings
    }
    try {
      const saved = editing
        ? await api(`/children/${child.id}`, { method: 'PATCH', body })
        : await api('/children', { method: 'POST', body: { ...body, consent_given: form.consent_given, ...(choosingParent ? { parent_id: form.parent_id ?? undefined } : {}) } })
      onSaved(saved)
      onOpenChange(false)
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  const consentLabel = user.role === 'parent'
    ? 'I am this child’s parent or guardian and I agree to Speechomania storing their details and learning progress (consent v1).'
    : 'The parent has given written consent for Speechomania to store this child’s details and learning progress (consent v1).'

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${child.display_name}` : 'Add a child'}
      description={editing ? undefined : 'Children use the learning app inside their parent’s account.'}
      size="wide"
      footer={(
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="child-form" disabled={pending}>{pending ? 'Saving…' : editing ? 'Save changes' : 'Add child'}</Button>
        </>
      )}
    >
      <form id="child-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormAlert error={error && !Object.keys(errors).length ? error : null} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Child’s name" value={form.display_name} onChange={set('display_name')} isRequired isInvalid={Boolean(errors.display_name)} hint={errors.display_name} autoFocus />
          <Input label="Date of birth" type="date" value={form.date_of_birth ?? ''} onChange={set('date_of_birth')} isInvalid={Boolean(errors.date_of_birth)} hint={errors.date_of_birth} />
        </div>
        {choosingParent ? (
          <PersonPicker
            label="Parent"
            role="parent"
            isRequired
            placeholder="Search parents by name or email"
            value={form.parent_id}
            onChange={set('parent_id')}
            error={errors.parent_id ?? (error?.message === 'Choose the parent for this child' ? error.message : undefined)}
          />
        ) : null}
        <SensoryFields value={form.sensory_settings} onChange={set('sensory_settings')} />
        {!editing ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-background-secondary-default p-3">
            <Checkbox isSelected={form.consent_given} onChange={set('consent_given')}>{consentLabel}</Checkbox>
            {errors.consent_given ? <span className="text-body-2-medium text-text-error-primary">{errors.consent_given}</span> : null}
          </div>
        ) : null}
      </form>
    </Modal>
  )
}

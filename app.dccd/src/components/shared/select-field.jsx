import { Label } from '@/components/base/input/label'
import { HintText } from '@/components/base/input/hint-text'
import { Select, SelectItem } from '@/components/base/select/select'

export function SelectField({ label, options, value, onChange, error, placeholder = 'Choose…', isRequired, className, size = 'md' }) {
  return (
    <div className={className ?? 'flex flex-col gap-1'}>
      {label ? <Label isRequired={isRequired}>{label}</Label> : null}
      <Select
        size={size}
        aria-label={label ?? placeholder}
        selectedKey={value ?? null}
        onSelectionChange={(key) => onChange(key)}
        placeholder={placeholder}
        isInvalid={Boolean(error)}
      >
        {options.map((option) => (
          <SelectItem key={option.id} id={option.id} textValue={option.label}>{option.label}</SelectItem>
        ))}
      </Select>
      {error ? <HintText isInvalid>{error}</HintText> : null}
    </div>
  )
}

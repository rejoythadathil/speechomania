import { RiSearchLine } from '@remixicon/react'
import { useState } from 'react'
import { ComboBox, Group, Input, ListBox, ListBoxItem, Popover } from 'react-aria-components'
import { HintText } from '@/components/base/input/hint-text'
import { Label } from '@/components/base/input/label'
import { MENU_ITEM, MENU_ITEM_ACTIVE, MENU_ITEMS_CONTAINER, MENU_POPOVER_SURFACE } from '@/components/base/dropdown/menu-styles'
import { UserAvatar } from '@/components/shared/user-avatar.jsx'
import { useDebounced } from '@/hooks/use-debounced.js'
import { useResource } from '@/hooks/use-resource.js'
import { cx } from '@/utils/cx'

export function PersonPicker({ label, role, value, initialLabel = '', onChange, error, isRequired, extraOption, placeholder }) {
  const [text, setText] = useState(initialLabel)
  const [selectedLabel, setSelectedLabel] = useState(initialLabel)
  const typing = text !== selectedLabel
  const q = useDebounced(typing ? text.trim() : '', 200)
  const people = useResource('/users', { role, status: 'active', q: q || undefined, page_size: 10 })
  const found = (people.data?.items ?? []).map((person) => ({ id: person.id, label: person.full_name, detail: person.email, avatar: person.metadata?.avatar ?? person.id }))
  const items = extraOption && !q ? [extraOption, ...found] : found
  const more = (people.data?.total ?? 0) - found.length

  return (
    <ComboBox
      className="flex flex-col gap-1"
      items={items}
      selectedKey={value}
      inputValue={text}
      onInputChange={setText}
      onSelectionChange={(key) => {
        if (key === null) return
        const item = items.find((option) => option.id === key)
        setText(item?.label ?? '')
        setSelectedLabel(item?.label ?? '')
        onChange(key)
      }}
      menuTrigger="focus"
      allowsEmptyCollection
      isInvalid={Boolean(error)}
      isRequired={isRequired}
      aria-label={label ?? placeholder}
    >
      {label ? <Label isRequired={isRequired}>{label}</Label> : null}
      <Group className="flex items-center gap-2 rounded-2lg border border-border-button-default bg-background-primary-default px-2.5 py-2 shadow-xs focus-within:ring-2 focus-within:ring-border-focus-ring">
        <RiSearchLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        <Input className="min-w-0 flex-1 bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-tertiary" placeholder={placeholder} onFocus={(event) => event.target.select()} />
      </Group>
      {error ? <HintText isInvalid>{error}</HintText> : null}
      <Popover offset={4} className={cx(MENU_POPOVER_SURFACE, 'w-(--trigger-width) p-2')}>
        <ListBox className={cx(MENU_ITEMS_CONTAINER, 'max-h-64 overflow-auto')} renderEmptyState={() => <p className="p-2 text-body-2-medium text-text-tertiary">{people.loading ? 'Searching…' : 'No one matches'}</p>}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className={({ isFocused, isSelected }) => cx(MENU_ITEM, (isFocused || isSelected) && MENU_ITEM_ACTIVE)}>
              {item.avatar ? <UserAvatar seed={item.avatar} size={24} /> : null}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-2-semibold">{item.label}</span>
                {item.detail ? <span className="truncate text-caption-1-medium text-text-tertiary">{item.detail}</span> : null}
              </span>
            </ListBoxItem>
          )}
        </ListBox>
        {more > 0 ? <p className="border-t border-[var(--line)] px-2 pt-2 text-caption-1-medium text-text-tertiary">{more} more. Keep typing to narrow down.</p> : null}
      </Popover>
    </ComboBox>
  )
}

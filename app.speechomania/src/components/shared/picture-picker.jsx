import { RiImageAddLine } from '@remixicon/react'
import { useState } from 'react'
import { ComboBox, Group, Input, ListBox, ListBoxItem, Popover } from 'react-aria-components'
import {
  MENU_ITEM,
  MENU_ITEM_ACTIVE,
  MENU_ITEMS_CONTAINER,
  MENU_POPOVER_SURFACE
} from '@/components/base/dropdown/menu-styles'
import { ART, Art } from '@/components/child/art.jsx'
import { cx } from '@/utils/cx'

const NAMES = Object.keys(ART).sort()
const SHOWN = 40

export function PicturePicker({ onPick, label = 'Add a picture' }) {
  const [text, setText] = useState('')
  const q = text.trim().toLowerCase()
  const found = NAMES.filter((name) => name.includes(q))
  const items = found.slice(0, SHOWN).map((name) => ({ id: name, label: name }))

  return (
    <ComboBox
      className="flex flex-col"
      items={items}
      selectedKey={null}
      inputValue={text}
      onInputChange={setText}
      onSelectionChange={(key) => {
        if (key === null) return
        onPick(key)
        setText('')
      }}
      menuTrigger="focus"
      allowsEmptyCollection
      aria-label={label}
    >
      <Group className="flex w-52 items-center gap-2 rounded-2lg border border-border-button-default bg-background-primary-default px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-border-focus-ring">
        <RiImageAddLine className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        <Input
          className="min-w-0 flex-1 bg-transparent text-body-2-medium text-text-primary outline-none placeholder:text-text-tertiary"
          placeholder={label}
        />
      </Group>
      <Popover offset={4} className={cx(MENU_POPOVER_SURFACE, 'w-64 p-2')}>
        <ListBox
          className={cx(MENU_ITEMS_CONTAINER, 'max-h-72 overflow-auto')}
          renderEmptyState={() => (
            <p className="p-2 text-body-2-medium text-text-tertiary">No picture with that name</p>
          )}
        >
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.label}
              className={({ isFocused }) => cx(MENU_ITEM, isFocused && MENU_ITEM_ACTIVE)}
            >
              <Art name={item.id} className="size-8 shrink-0" />
              <span className="truncate text-body-2-semibold">{item.label}</span>
            </ListBoxItem>
          )}
        </ListBox>
        {found.length > SHOWN ? (
          <p className="border-t border-[var(--line)] px-2 pt-2 text-caption-1-medium text-text-tertiary">
            {found.length - SHOWN} more. Keep typing to narrow down.
          </p>
        ) : null}
      </Popover>
    </ComboBox>
  )
}

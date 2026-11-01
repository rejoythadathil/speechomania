import { PersonPicker } from './person-picker.jsx'

const childItem = (child) => ({
  id: child.id,
  label: child.display_name,
  detail: [child.parent_name, child.mentor_name ? `Mentor ${child.mentor_name}` : null]
    .filter(Boolean)
    .join(' · ')
})

export function ChildPicker(props) {
  return (
    <PersonPicker
      {...props}
      path="/children"
      query={{ status: 'active' }}
      toItem={childItem}
      emptyText="No child matches"
    />
  )
}

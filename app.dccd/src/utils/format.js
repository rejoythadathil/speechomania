const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '—')
export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '—')

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

export function age(dateOfBirth) {
  if (!dateOfBirth) return null
  const born = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) years -= 1
  return years
}

export const titleCase = (text = '') => text.replaceAll('_', ' ').replace(/^\w/, (char) => char.toUpperCase())

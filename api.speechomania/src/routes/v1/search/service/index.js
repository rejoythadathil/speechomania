import { listChildren } from '../../children/service/index.js'
import { listLessons } from '../../lessons/service/index.js'
import { listUsers } from '../../users/service/index.js'
import { TOP } from '../constants/index.js'

export async function search(user, q) {
  const [children, lessons, people] = await Promise.all([
    listChildren(user, { q, ...TOP }),
    user.role === 'parent' ? null : listLessons(user, { q, ...TOP }),
    user.role === 'admin' ? listUsers({ q, ...TOP }) : null
  ])
  const groups = {
    children: {
      total: children.total,
      items: children.items.map((child) => ({ id: child.id, display_name: child.display_name, parent_name: child.parent_name, mentor_name: child.mentor_name, status: child.status }))
    }
  }
  if (lessons) {
    groups.lessons = { total: lessons.total, items: lessons.items.map(({ id, slug, title, version, status }) => ({ id, slug, title, version, status })) }
  }
  if (people) {
    groups.people = {
      total: people.total,
      items: people.items.map((person) => ({ id: person.id, full_name: person.full_name, email: person.email, role: person.role, status: person.status, avatar: person.metadata?.avatar ?? person.id }))
    }
  }
  return { q, groups }
}

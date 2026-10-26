import { RiBookOpenLine, RiDashboardLine, RiEditBoxLine, RiFileListLine, RiParentLine, RiShieldUserLine, RiUserHeartLine, RiUserStarLine } from '@remixicon/react'

export const NAVIGATION = {
  admin: [
    { label: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: RiDashboardLine }] },
    {
      label: 'People',
      items: [
        { to: '/children', label: 'Children', icon: RiUserHeartLine },
        { to: '/people/mentor', label: 'Mentors', icon: RiUserStarLine },
        { to: '/people/parent', label: 'Parents', icon: RiParentLine },
        { to: '/people/admin', label: 'Admins', icon: RiShieldUserLine }
      ]
    },
    {
      label: 'Content',
      items: [
        { to: '/lessons', label: 'Lessons', icon: RiBookOpenLine },
        { to: '/change-requests', label: 'Change requests', icon: RiEditBoxLine }
      ]
    },
    { label: 'System', items: [{ to: '/audit', label: 'Audit log', icon: RiFileListLine }] }
  ],
  mentor: [
    { label: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: RiDashboardLine }] },
    {
      label: 'Work',
      items: [
        { to: '/children', label: 'My children', icon: RiUserHeartLine },
        { to: '/lessons', label: 'Lessons', icon: RiBookOpenLine },
        { to: '/change-requests', label: 'Change requests', icon: RiEditBoxLine }
      ]
    }
  ],
  parent: [
    {
      label: 'Family',
      items: [
        { to: '/dashboard', label: 'Overview', icon: RiDashboardLine },
        { to: '/children', label: 'My children', icon: RiUserHeartLine }
      ]
    }
  ]
}

export const ROLE_LABEL = { admin: 'Administrator', mentor: 'Mentor', parent: 'Parent' }

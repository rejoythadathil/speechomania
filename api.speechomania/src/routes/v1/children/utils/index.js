import { isoDate } from '../../../../../common-service/http/utils/index.js'

export const childScope = (user) =>
  user.role === 'admin'
    ? {}
    : user.role === 'mentor'
      ? { mentor_id: user.id }
      : { parent_id: user.id }

export function childView(
  { pin_hash: pinHash, parent, mentor, date_of_birth: dateOfBirth, ...child },
  role
) {
  return {
    ...child,
    date_of_birth: isoDate(dateOfBirth),
    has_pin: Boolean(pinHash),
    parent_name: parent.full_name,
    parent_email: role === 'mentor' ? null : parent.email,
    mentor_name: mentor?.full_name ?? null
  }
}

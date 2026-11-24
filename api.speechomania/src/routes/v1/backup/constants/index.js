export const BACKUP_TYPES = ['children', 'people', 'notes', 'lessons', 'assessments']
export const RETENTION_DAYS = [60, 90]
export const DEFAULT_RETENTION_DAYS = 90
export const SETTINGS_ENTITY = 'settings'
export const SETTINGS_ID = 'backup'
export const SOFT_DELETED = 'soft_deleted'
export const ERASED_EMAIL = '@erased.invalid'
export const PURGE_EVERY_MS = 60 * 60 * 1000
export const PURGE_LOCK = 'backup:purge'
export const DAY_MS = 24 * 60 * 60 * 1000
export const ENTITY_TYPES = {
  children: 'child',
  people: 'user',
  notes: 'remark',
  lessons: 'lesson',
  assessments: 'assessment'
}

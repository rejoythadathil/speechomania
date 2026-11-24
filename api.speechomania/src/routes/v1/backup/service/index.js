import { audit } from '../../../../../common-service/audit/service/index.js'
import { valkey } from '../../../../../common-service/cache/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  deleteAuthUser,
  setAuthUserDisabled
} from '../../../../../common-service/firebase/service/index.js'
import { pageOf } from '../../../../../common-service/http/utils/index.js'
import { logger } from '../../../../../common-service/logger/service/index.js'
import { wordsOf } from '../../../../../common-service/reports/utils/index.js'
import {
  BACKUP_TYPES,
  DEFAULT_RETENTION_DAYS,
  ENTITY_TYPES,
  ERASED_EMAIL,
  PURGE_EVERY_MS,
  PURGE_LOCK,
  SETTINGS_ENTITY,
  SETTINGS_ID,
  SOFT_DELETED
} from '../constants/index.js'
import {
  backupItemNotFound,
  draftExists,
  restoreChildFirst,
  restoreParentFirst
} from '../exception/index.js'
import { cutoff, daysLeft, purgeOn, snippet, withoutMark } from '../utils/index.js'

const markedAt = (row) => row.metadata?.deleted?.at ?? row.deleted_at ?? row.created_at

const TYPES = {
  children: {
    model: 'children',
    where: { deleted_at: { not: null } },
    select: {
      id: true,
      display_name: true,
      deleted_at: true,
      metadata: true,
      parent: { select: { full_name: true } }
    },
    orderBy: [{ deleted_at: 'desc' }, { id: 'asc' }],
    view: (row) => ({ title: row.display_name, detail: `Parent: ${row.parent.full_name}` })
  },
  people: {
    model: 'users',
    where: { deleted_at: { not: null }, NOT: { email: { endsWith: ERASED_EMAIL } } },
    select: { id: true, full_name: true, role: true, deleted_at: true, metadata: true },
    orderBy: [{ deleted_at: 'desc' }, { id: 'asc' }],
    view: (row) => ({ title: row.full_name, detail: wordsOf(row.role) })
  },
  notes: {
    model: 'remarks',
    where: { deleted_at: { not: null } },
    select: {
      id: true,
      body: true,
      deleted_at: true,
      metadata: true,
      child: { select: { display_name: true } },
      author: { select: { full_name: true } }
    },
    orderBy: [{ deleted_at: 'desc' }, { id: 'asc' }],
    view: (row) => ({
      title: snippet(row.body),
      detail: `About ${row.child.display_name} · by ${row.author.full_name}`
    })
  },
  lessons: {
    model: 'lessons',
    where: { status: SOFT_DELETED },
    select: { id: true, title: true, slug: true, created_at: true, metadata: true },
    orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
    view: (row) => ({ title: row.title, detail: `Draft of ${row.slug}` })
  },
  assessments: {
    model: 'assessments',
    where: { status: SOFT_DELETED },
    select: { id: true, title: true, created_at: true, metadata: true },
    orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
    view: () => ({ detail: 'Draft assessment' })
  }
}

export async function retentionDays() {
  const latest = await db.audit_logs.findFirst({
    where: { entity_type: SETTINGS_ENTITY, entity_id: SETTINGS_ID },
    orderBy: { created_at: 'desc' },
    select: { diff: true }
  })
  return latest?.diff?.retention_days ?? DEFAULT_RETENTION_DAYS
}

export async function updateSettings(user, { retention_days: days }, ctx) {
  const from = await retentionDays()
  await audit(db, {
    actor: user,
    action: 'settings.backup_updated',
    entityType: SETTINGS_ENTITY,
    entityId: SETTINGS_ID,
    diff: { retention_days: days, from },
    ctx
  })
  return { retention_days: days }
}

export async function summary() {
  const [days, counts] = await Promise.all([
    retentionDays(),
    Promise.all(
      BACKUP_TYPES.map((type) => db[TYPES[type].model].count({ where: TYPES[type].where }))
    )
  ])
  return {
    retention_days: days,
    counts: Object.fromEntries(BACKUP_TYPES.map((type, index) => [type, counts[index]]))
  }
}

export async function listDeleted(type, window) {
  const kind = TYPES[type]
  const [days, page] = await Promise.all([
    retentionDays(),
    pageOf(
      db[kind.model],
      { where: kind.where, select: kind.select, orderBy: kind.orderBy },
      window
    )
  ])
  const byIds = [...new Set(page.items.map((row) => row.metadata?.deleted?.by).filter(Boolean))]
  const names = new Map(
    (
      await db.users.findMany({
        where: { id: { in: byIds } },
        select: { id: true, full_name: true }
      })
    ).map((user) => [user.id, user.full_name])
  )
  return {
    ...page,
    retention_days: days,
    items: page.items.map((row) => {
      const at = markedAt(row)
      return {
        id: row.id,
        type,
        title: row.title,
        ...kind.view(row),
        deleted_at: at,
        deleted_by: names.get(row.metadata?.deleted?.by) ?? null,
        purge_on: purgeOn(at, days),
        days_left: daysLeft(at, days)
      }
    })
  }
}

async function findDeleted(tx, type, id) {
  const kind = TYPES[type]
  const row = await tx[kind.model].findFirst({ where: { id, ...kind.where } })
  if (!row) throw backupItemNotFound()
  return row
}

const RESTORE = {
  async children(tx, row) {
    const parent = await tx.users.findUnique({ where: { id: row.parent_id } })
    if (parent.deleted_at) throw restoreParentFirst()
    await tx.children.update({
      where: { id: row.id },
      data: {
        deleted_at: null,
        status: row.metadata?.deleted?.status ?? 'active',
        metadata: withoutMark(row.metadata),
        updated_at: new Date()
      }
    })
  },
  async people(tx, row) {
    const status = row.metadata?.deleted?.status ?? 'active'
    await tx.users.update({
      where: { id: row.id },
      data: {
        deleted_at: null,
        status,
        metadata: withoutMark(row.metadata),
        updated_at: new Date()
      }
    })
    const children = row.metadata?.deleted?.unassigned_children ?? []
    if (children.length)
      await tx.children.updateMany({
        where: { id: { in: children }, mentor_id: null, deleted_at: null },
        data: { mentor_id: row.id, updated_at: new Date() }
      })
    return () => row.firebase_uid && setAuthUserDisabled(row.firebase_uid, status === 'disabled')
  },
  async notes(tx, row) {
    const child = await tx.children.findUnique({ where: { id: row.child_id } })
    if (child.deleted_at) throw restoreChildFirst()
    await tx.remarks.update({
      where: { id: row.id },
      data: { deleted_at: null, metadata: withoutMark(row.metadata), updated_at: new Date() }
    })
  },
  async lessons(tx, row) {
    if (await tx.lessons.findFirst({ where: { slug: row.slug, status: 'draft' } }))
      throw draftExists()
    await tx.lessons.update({
      where: { id: row.id },
      data: { status: 'draft', metadata: withoutMark(row.metadata) }
    })
  },
  async assessments(tx, row) {
    await tx.assessments.update({
      where: { id: row.id },
      data: { status: 'draft', metadata: withoutMark(row.metadata), updated_at: new Date() }
    })
  }
}

export async function restore(user, type, id, ctx) {
  const after = await db.$transaction(async (tx) => {
    const row = await findDeleted(tx, type, id)
    const then = await RESTORE[type](tx, row)
    await audit(tx, {
      actor: user,
      action: 'backup.restored',
      entityType: ENTITY_TYPES[type],
      entityId: id,
      diff: { type },
      ctx
    })
    return then
  }, SERIAL)
  await after?.()
  return { id, type, restored: true }
}

async function expired(type, before) {
  const kind = TYPES[type]
  if (kind.select.deleted_at)
    return db[kind.model].findMany({
      where: { ...kind.where, deleted_at: { lt: before } },
      select: type === 'people' ? { id: true, firebase_uid: true } : { id: true }
    })
  const rows = await db[kind.model].findMany({
    where: kind.where,
    select: { id: true, created_at: true, metadata: true }
  })
  return rows.filter((row) => new Date(markedAt(row)) < before)
}

const PURGE = {
  notes: (tx, ids) => tx.remarks.deleteMany({ where: { id: { in: ids } } }),
  async children(tx, ids) {
    await tx.attempts.deleteMany({ where: { child_id: { in: ids } } })
    await tx.remarks.deleteMany({ where: { child_id: { in: ids } } })
    return tx.children.deleteMany({ where: { id: { in: ids } } })
  },
  async people(tx, ids) {
    for (const id of ids)
      await tx.users.update({
        where: { id },
        data: {
          firebase_uid: null,
          email: `erased-${id}${ERASED_EMAIL}`,
          full_name: 'Deleted account',
          phone: null,
          status: 'disabled',
          metadata: { purged_at: new Date().toISOString() },
          updated_at: new Date()
        }
      })
    return { count: ids.length }
  },
  lessons: (tx, ids) => tx.lessons.deleteMany({ where: { id: { in: ids } } }),
  assessments: (tx, ids) => tx.assessments.deleteMany({ where: { id: { in: ids } } })
}

export async function purgeExpired(now = new Date()) {
  const before = cutoff(await retentionDays(), now)
  const purged = {}
  const logins = []
  for (const type of ['notes', 'children', 'people', 'lessons', 'assessments']) {
    const rows = await expired(type, before)
    if (!rows.length) continue
    const ids = rows.map((row) => row.id)
    await db.$transaction(async (tx) => {
      purged[type] = (await PURGE[type](tx, ids)).count
      await audit(tx, {
        actor: null,
        action: 'backup.purged',
        entityType: ENTITY_TYPES[type],
        entityId: type,
        diff: { type, ids },
        ctx: {}
      })
    }, SERIAL)
    logins.push(...rows.map((row) => row.firebase_uid).filter(Boolean))
  }
  for (const uid of logins) await deleteAuthUser(uid)
  return purged
}

export async function purgeOnce() {
  const claimed = await valkey.send('SET', [
    PURGE_LOCK,
    '1',
    'NX',
    'PX',
    String(PURGE_EVERY_MS - 60000)
  ])
  if (claimed !== 'OK') return null
  const purged = await purgeExpired()
  if (Object.keys(purged).length) logger.info({ purged }, 'backup purged expired items')
  return purged
}

export function startPurgeSchedule() {
  const run = () =>
    purgeOnce().catch((error) => logger.error({ err: error }, 'backup purge failed'))
  run()
  return setInterval(run, PURGE_EVERY_MS)
}

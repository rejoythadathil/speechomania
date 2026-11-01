import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { forbidden } from '../../../../../common-service/http/exception/index.js'
import { containsText, pageOf } from '../../../../../common-service/http/utils/index.js'
import { CONSENT_VERSION } from '../constants/index.js'
import {
  childNotFound,
  chooseActive,
  chooseParent,
  lessonsNotPublished
} from '../exception/index.js'
import { childScope, childView } from '../utils/index.js'

const fields = {
  id: true,
  display_name: true,
  date_of_birth: true,
  avatar_key: true,
  sensory_settings: true,
  assigned_lessons: true,
  assigned_assessments: true,
  consent_version: true,
  consent_at: true,
  status: true,
  metadata: true,
  created_at: true,
  updated_at: true,
  parent_id: true,
  mentor_id: true,
  pin_hash: true,
  parent: { select: { full_name: true, email: true } },
  mentor: { select: { full_name: true } }
}

export async function findScopedChild(tx, user, id) {
  const child = await tx.children.findFirst({
    where: { id, deleted_at: null, ...childScope(user) },
    select: fields
  })
  if (!child) throw childNotFound()
  return childView(child, user.role)
}

export async function listChildren(
  user,
  { status, mentor_id, parent_id, unassigned, q, ...window }
) {
  const page = await pageOf(
    db.children,
    {
      where: {
        deleted_at: null,
        AND: [
          childScope(user),
          status ? { status } : {},
          parent_id ? { parent_id } : {},
          mentor_id ? { mentor_id } : {},
          unassigned ? { mentor_id: null } : {},
          q ? { display_name: containsText(q) } : {}
        ]
      },
      select: fields,
      orderBy: [{ display_name: 'asc' }, { id: 'asc' }]
    },
    window
  )
  return { ...page, items: page.items.map((child) => childView(child, user.role)) }
}

export function getChild(user, id, ctx) {
  return db.$transaction(async (tx) => {
    const child = await findScopedChild(tx, user, id)
    await audit(tx, { actor: user, action: 'child.viewed', entityType: 'child', entityId: id, ctx })
    return child
  })
}

async function requireRole(tx, id, role, label) {
  const found = await tx.users.count({
    where: { id, role, status: { not: 'disabled' }, deleted_at: null }
  })
  if (!found) throw chooseActive(label)
}

export function createChild(user, body, ctx) {
  const parentId = user.role === 'parent' ? user.id : body.parent_id
  if (!parentId) throw chooseParent()
  if (user.role === 'parent' && body.parent_id && body.parent_id !== user.id) throw forbidden()
  return db.$transaction(async (tx) => {
    await requireRole(tx, parentId, 'parent', 'parent')
    const { id } = await tx.children.create({
      data: {
        parent_id: parentId,
        display_name: body.display_name,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : null,
        avatar_key: body.avatar_key || null,
        sensory_settings: body.sensory_settings ?? {},
        consent_version: CONSENT_VERSION,
        metadata: body.metadata ?? {}
      },
      select: { id: true }
    })
    await audit(tx, {
      actor: user,
      action: 'child.created',
      entityType: 'child',
      entityId: id,
      diff: { consent_version: CONSENT_VERSION },
      ctx
    })
    return findScopedChild(tx, user, id)
  })
}

export async function updateChild(user, id, body, ctx) {
  if (user.role !== 'admin' && body.status !== undefined) throw forbidden()
  if (user.role !== 'parent' && body.pin !== undefined) throw forbidden()
  const pinHash = body.pin ? await Bun.password.hash(body.pin) : null
  return db.$transaction(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    await tx.children.update({
      where: { id },
      data: {
        display_name: body.display_name,
        date_of_birth:
          body.date_of_birth === undefined
            ? undefined
            : body.date_of_birth
              ? new Date(body.date_of_birth)
              : null,
        avatar_key: body.avatar_key === undefined ? undefined : body.avatar_key || null,
        sensory_settings: { ...current.sensory_settings, ...body.sensory_settings },
        status: body.status,
        pin_hash: body.pin === undefined ? undefined : pinHash,
        metadata: { ...current.metadata, ...body.metadata },
        updated_at: new Date()
      }
    })
    await audit(tx, {
      actor: user,
      action: 'child.updated',
      entityType: 'child',
      entityId: id,
      diff: { fields: Object.keys(body) },
      ctx
    })
    return findScopedChild(tx, user, id)
  }, SERIAL)
}

export function assignMentor(user, id, mentorId, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    if (mentorId) await requireRole(tx, mentorId, 'mentor', 'mentor')
    await tx.children.update({
      where: { id },
      data: { mentor_id: mentorId, updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'child.mentor_assigned',
      entityType: 'child',
      entityId: id,
      diff: { from: current.mentor_id, to: mentorId },
      ctx
    })
    return findScopedChild(tx, user, id)
  })
}

export function assignLessons(user, id, slugs, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    const found = await tx.lessons.findMany({
      where: { status: 'published', slug: { in: slugs } },
      select: { slug: true }
    })
    const published = new Set(found.map((row) => row.slug.toLowerCase()))
    const missing = slugs.filter((slug) => !published.has(slug.toLowerCase()))
    if (missing.length) throw lessonsNotPublished(missing)
    await tx.children.update({
      where: { id },
      data: { assigned_lessons: slugs, updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'child.lessons_assigned',
      entityType: 'child',
      entityId: id,
      diff: { from: current.assigned_lessons, to: slugs },
      ctx
    })
    return findScopedChild(tx, user, id)
  })
}

export async function deleteChild(user, id, ctx) {
  await db.$transaction(async (tx) => {
    await findScopedChild(tx, user, id)
    await tx.children.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'archived', updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'child.deleted',
      entityType: 'child',
      entityId: id,
      ctx
    })
  })
}

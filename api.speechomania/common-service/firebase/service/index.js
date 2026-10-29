import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from '../../../config/index.js'
import { EMAIL_EXISTS } from '../constants/index.js'

const options = config.APP_ENV === 'prod'
  ? { credential: applicationDefault(), projectId: config.FIREBASE_PROJECT_ID }
  : { projectId: config.FIREBASE_PROJECT_ID }

const auth = getAuth(getApps()[0] ?? initializeApp(options))

export const verifyToken = (token, checkRevoked = false) => auth.verifyIdToken(token, checkRevoked)

export async function createAuthUser({ email, fullName }) {
  try {
    const user = await auth.createUser({ email, displayName: fullName })
    return user.uid
  } catch (error) {
    if (error.code !== EMAIL_EXISTS) throw error
    const existing = await auth.getUserByEmail(email)
    return existing.uid
  }
}

export const inviteLink = (email) => auth.generatePasswordResetLink(email)

export const setAuthUserDisabled = (uid, disabled) => auth.updateUser(uid, { disabled })

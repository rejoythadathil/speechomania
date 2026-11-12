import {
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/services/api.js'
import { auth } from '@/services/firebase.js'

const AuthContext = createContext(null)
const google = new GoogleAuthProvider()
google.setCustomParameters({ prompt: 'select_account' })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, error: null })
  const pendingGoogle = useRef(null)

  const loadProfile = useCallback(async () => {
    try {
      const user = await api('/auth/me')
      setState({ status: 'signed-in', user, error: null })
    } catch (error) {
      await signOut(auth)
      setState({ status: 'signed-out', user: null, error: error.message })
    }
  }, [])

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          loadProfile()
          return
        }
        setState((current) => ({ status: 'signed-out', user: null, error: current.error }))
      }),
    [loadProfile]
  )

  const value = useMemo(
    () => ({
      ...state,
      signIn: async (email, password) => {
        setState((current) => ({ ...current, error: null }))
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        const credential = pendingGoogle.current
        pendingGoogle.current = null
        if (credential) await linkWithCredential(user, credential).catch(() => null)
      },
      signInWithGoogle: async () => {
        setState((current) => ({ ...current, error: null }))
        try {
          await signInWithPopup(auth, google)
        } catch (error) {
          if (error.code === 'auth/account-exists-with-different-credential') {
            pendingGoogle.current = GoogleAuthProvider.credentialFromError(error)
          }
          throw error
        }
      },
      setUser: (user) => setState((current) => ({ ...current, user })),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOut: () => signOut(auth)
    }),
    [state]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export const useAuth = () => use(AuthContext)

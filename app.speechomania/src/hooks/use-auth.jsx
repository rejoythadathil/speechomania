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
import { api, setGuest } from '@/services/api.js'
import { auth } from '@/services/firebase.js'

const AuthContext = createContext(null)
const google = new GoogleAuthProvider()
google.setCustomParameters({ prompt: 'select_account' })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, error: null })
  const pendingGoogle = useRef(null)

  const loadProfile = useCallback(async (firebaseUser) => {
    try {
      const user = await api('/auth/me')
      setGuest(false)
      setState({ status: 'signed-in', user, error: null })
    } catch (error) {
      const google = firebaseUser.providerData.some((p) => p.providerId === 'google.com')
      if (error.status === 403 && google) {
        const child = await api('/guest').catch(() => null)
        if (child) {
          setGuest(true)
          setState({
            status: 'signed-in',
            user: { role: 'guest', full_name: firebaseUser.displayName, child },
            error: null
          })
          return
        }
      }
      await signOut(auth)
      setState({ status: 'signed-out', user: null, error: error.message })
    }
  }, [])

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          loadProfile(firebaseUser)
          return
        }
        setGuest(false)
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

export function homeFor(user) {
  if (user?.role === 'guest') return `/learn/${user.child.id}`
  return user?.role === 'parent' ? '/learn' : '/dashboard'
}

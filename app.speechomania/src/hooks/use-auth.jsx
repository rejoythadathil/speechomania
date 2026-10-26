import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/services/api.js'
import { auth } from '@/services/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, error: null })

  const loadProfile = useCallback(async () => {
    try {
      const user = await api('/auth/me')
      setState({ status: 'signed-in', user, error: null })
    } catch (error) {
      await signOut(auth)
      setState({ status: 'signed-out', user: null, error: error.message })
    }
  }, [])

  useEffect(() => onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      loadProfile()
      return
    }
    setState((current) => ({ status: 'signed-out', user: null, error: current.error }))
  }), [loadProfile])

  const value = useMemo(() => ({
    ...state,
    signIn: async (email, password) => {
      setState((current) => ({ ...current, error: null }))
      await signInWithEmailAndPassword(auth, email, password)
    },
    setUser: (user) => setState((current) => ({ ...current, user })),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    signOut: () => signOut(auth)
  }), [state])

  return <AuthContext value={value}>{children}</AuthContext>
}

export const useAuth = () => use(AuthContext)

import { createContext, useContext } from 'react'

import type { Me } from '../api/types'

export type AuthState = {
  me: Me | null
  loading: boolean
  login: (email: string, password: string) => Promise<Me>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export const ME_QUERY_KEY = ['me']

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

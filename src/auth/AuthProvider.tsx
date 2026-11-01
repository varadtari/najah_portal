import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactNode } from 'react'

import { api, ApiError } from '../api/client'
import type { Me } from '../api/types'
import { AuthContext, ME_QUERY_KEY, type AuthState } from './session'

// The session lives in an HttpOnly cookie the page cannot read, so "am I signed in?" is
// answered by asking the API. A 401 means signed out; anything else is a real error.
async function fetchMe(): Promise<Me | null> {
  try {
    return await api<Me>('/v1/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, staleTime: 5 * 60_000 })

  const login = useCallback(
    async (email: string, password: string) => {
      const me = await api<Me>('/v1/auth/login', { method: 'POST', body: { email, password } })
      queryClient.clear()
      queryClient.setQueryData(ME_QUERY_KEY, me)
      return me
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await api('/v1/auth/logout', { method: 'POST' })
    } finally {
      // Drop every cached gym record so the next login never sees the previous user's data.
      queryClient.clear()
      queryClient.setQueryData(ME_QUERY_KEY, null)
    }
  }, [queryClient])

  const value = useMemo<AuthState>(() => ({ me: data ?? null, loading: isPending, login, logout }), [data, isPending, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

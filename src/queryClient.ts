import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from './api/client'
import { ME_QUERY_KEY } from './auth/session'

export function createQueryClient(): QueryClient {
  // Any request answered 401 means the session ended (expired, signed out elsewhere, or the
  // user was deactivated). Clearing "me" sends the app back to the login screen.
  const onApiError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(ME_QUERY_KEY, null)
    }
  }

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: onApiError }),
    mutationCache: new MutationCache({ onError: onApiError }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
        refetchOnWindowFocus: true,
      },
    },
  })

  return queryClient
}

import { createContext, useContext } from 'react'

import type { Checkin } from '../api/types'

export type LiveStatus = 'connecting' | 'live' | 'offline'

export type LiveState = {
  status: LiveStatus
  /** Latest check-ins, newest first: seeded from the API, then kept current by the stream. */
  feed: Checkin[]
  /** Ids of check-ins that arrived over the stream, for highlighting them. */
  freshIds: ReadonlySet<number>
}

export const LiveContext = createContext<LiveState>({ status: 'offline', feed: [], freshIds: new Set() })

export function useLive(): LiveState {
  return useContext(LiveContext)
}

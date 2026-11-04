import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { API_BASE, api } from '../api/client'
import type { Checkin, CheckinPage } from '../api/types'
import { ME_QUERY_KEY } from '../auth/session'
import { LiveContext, type LiveState, type LiveStatus } from './live-context'
import { LIVE_FEED_SIZE, mergeCheckins } from './merge'

// Lists that a new check-in changes. Refreshed together, at most once a second, so a burst of
// punches at opening time costs a handful of requests, not one per punch.
const AFFECTED_QUERIES = ['dashboard', 'checkins', 'devices']
const INVALIDATE_DEBOUNCE_MS = 1000
// After a stream error, how long to wait before asking whether the session is still valid.
const SESSION_CHECK_MS = 10_000

/** Keeps one EventSource open for the signed-in gym and shares what it hears. */
export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const [feed, setFeed] = useState<Checkin[]>([])
  const [freshIds, setFreshIds] = useState<ReadonlySet<number>>(new Set())
  const invalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSessionCheck = useRef(0)

  useEffect(() => {
    let cancelled = false

    const scheduleInvalidate = () => {
      if (invalidateTimer.current) return
      invalidateTimer.current = setTimeout(() => {
        invalidateTimer.current = null
        for (const key of AFFECTED_QUERIES) queryClient.invalidateQueries({ queryKey: [key] })
      }, INVALIDATE_DEBOUNCE_MS)
    }

    // Seeds the feed, and reloads it whenever the stream says events may have been missed.
    const reseed = async () => {
      try {
        const page = await api<CheckinPage>(`/v1/checkins?limit=${LIVE_FEED_SIZE}`)
        if (!cancelled) setFeed((current) => mergeCheckins(current, page.checkins))
      } catch {
        // The stream keeps working; the next refresh or reconnect tries again.
      }
    }
    reseed()

    const source = new EventSource(`${API_BASE}/v1/events/stream`, { withCredentials: true })

    source.addEventListener('ready', () => setStatus('live'))

    source.addEventListener('checkin', (event) => {
      const checkin = JSON.parse((event as MessageEvent).data) as Checkin
      setFeed((current) => mergeCheckins(current, [checkin]))
      setFreshIds((current) => new Set(current).add(checkin.id))
      scheduleInvalidate()
    })

    source.addEventListener('device', () => queryClient.invalidateQueries({ queryKey: ['devices'] }))

    source.addEventListener('refresh', () => {
      reseed()
      scheduleInvalidate()
    })

    source.addEventListener('signedout', () => {
      source.close()
      queryClient.setQueryData(ME_QUERY_KEY, null)
    })

    // EventSource retries on its own but cannot see status codes. If the session ended it
    // would retry forever, so after an error ask the API, at most every few seconds; a 401
    // there signs the user out, which unmounts this provider and closes the stream.
    source.onerror = () => {
      setStatus(source.readyState === EventSource.CLOSED ? 'offline' : 'connecting')
      const now = Date.now()
      if (now - lastSessionCheck.current > SESSION_CHECK_MS) {
        lastSessionCheck.current = now
        queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      }
    }

    return () => {
      cancelled = true
      source.close()
      if (invalidateTimer.current) clearTimeout(invalidateTimer.current)
      invalidateTimer.current = null
    }
  }, [queryClient])

  const value = useMemo<LiveState>(() => ({ status, feed, freshIds }), [status, feed, freshIds])
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>
}

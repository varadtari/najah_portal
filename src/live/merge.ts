import type { Checkin } from '../api/types'

export const LIVE_FEED_SIZE = 20

/** Adds check-ins to the feed: no duplicates, newest punch first, at most `cap` rows. A late
 *  upload from a device that was offline lands at its real time, not at the top. */
export function mergeCheckins(existing: Checkin[], incoming: Checkin[], cap = LIVE_FEED_SIZE): Checkin[] {
  const byId = new Map<number, Checkin>()
  for (const c of [...existing, ...incoming]) byId.set(c.id, c)
  return [...byId.values()]
    .sort((a, b) => (a.punchedAt === b.punchedAt ? b.id - a.id : a.punchedAt < b.punchedAt ? 1 : -1))
    .slice(0, cap)
}

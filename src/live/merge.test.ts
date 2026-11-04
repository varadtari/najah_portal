import { describe, expect, it } from 'vitest'

import { checkin } from '../test/fakeApi'
import { mergeCheckins } from './merge'

describe('mergeCheckins', () => {
  it('puts the newest punch first and drops duplicates', () => {
    const a = checkin({ id: 1, punchedAt: '2026-11-04T06:00:00Z' })
    const b = checkin({ id: 2, punchedAt: '2026-11-04T06:05:00Z' })

    expect(mergeCheckins([a], [b, a]).map((c) => c.id)).toEqual([2, 1])
  })

  it('places a late upload at its real time', () => {
    const recent = checkin({ id: 10, punchedAt: '2026-11-04T09:00:00Z' })
    const backlog = checkin({ id: 11, punchedAt: '2026-11-04T07:00:00Z' })

    expect(mergeCheckins([recent], [backlog]).map((c) => c.id)).toEqual([10, 11])
  })

  it('caps the feed', () => {
    const many = Array.from({ length: 30 }, (_, i) => checkin({ id: i, punchedAt: `2026-11-04T06:${String(i).padStart(2, '0')}:00Z` }))

    const merged = mergeCheckins([], many, 20)
    expect(merged).toHaveLength(20)
    expect(merged[0].id).toBe(29)
  })
})

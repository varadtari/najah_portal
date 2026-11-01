import { useState } from 'react'

import { useCheckins } from '../api/queries'
import type { Verdict } from '../api/types'
import { VerdictPill } from '../components/VerdictPill'
import { formatDate, formatTime, verifyLabel } from '../lib/format'

const FILTERS: { label: string; verdict?: Verdict }[] = [
  { label: 'All' },
  { label: 'Allowed', verdict: 'allowed' },
  { label: 'Entered while expired', verdict: 'allowed_but_expired' },
  { label: 'Not a member', verdict: 'unknown' },
]

function dayOf(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  return formatDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
}

export function CheckinsPage() {
  const [verdict, setVerdict] = useState<Verdict | undefined>(undefined)
  const { data, isPending, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useCheckins({ verdict })
  const checkins = data?.pages.flatMap((p) => p.checkins) ?? []

  return (
    <>
      <div className="top">
        <div>
          <h2>Check-ins</h2>
          <p>Every punch at your devices, newest first</p>
        </div>
      </div>

      <div className="glass panel">
        <div className="chips" role="group" aria-label="Filter check-ins">
          {FILTERS.map((f) => (
            <button key={f.label} aria-pressed={verdict === f.verdict} onClick={() => setVerdict(f.verdict)}>
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="form-error" style={{ margin: 14 }}>{error.message}</div>}
        {isPending && <div className="loading">Loading…</div>}
        {!isPending && checkins.length === 0 && (
          <div className="empty">{verdict ? 'No check-ins match this filter.' : 'No check-ins yet. They appear here as members use the device.'}</div>
        )}

        {checkins.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Member</th>
                <th>When</th>
                <th>Result</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((c) => (
                <tr key={c.id}>
                  <td className="who">
                    <b>{c.memberName ?? `Device user #${c.pin}`}</b>
                    <span>{verifyLabel(c.verifyMethod)}</span>
                  </td>
                  <td className="exp">
                    {formatTime(c.punchedAt)} · {dayOf(c.punchedAt)}
                  </td>
                  <td className="st">
                    <VerdictPill verdict={c.verdict} />
                  </td>
                  <td className="ac muted">{c.deviceName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {hasNextPage && (
          <div className="more">
            <button className="btn ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

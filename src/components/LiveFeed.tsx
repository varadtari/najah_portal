import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useMemberDetail } from '../api/queries'
import type { Checkin } from '../api/types'
import { useAuth } from '../auth/session'
import { formatTime, relativeTime, verifyLabel, whatsappReminderLink } from '../lib/format'
import { useLive } from '../live/live-context'
import { RenewModal } from './RenewModal'
import { VerdictPill } from './VerdictPill'

// Inline actions on an "entered while expired" row: the member is at the desk right now, the
// best moment to collect the renewal. Their details load when the row appears.
function ExpiredActions({ checkin }: { checkin: Checkin }) {
  const { me } = useAuth()
  const { data: member } = useMemberDetail(checkin.memberId)
  const [renewing, setRenewing] = useState(false)

  if (!member) return null

  return (
    <div className="acts">
      {member.status === 'overdue' ? (
        <>
          <a className="ib wa" href={whatsappReminderLink(member.phone, member.name, me?.gymName ?? 'your gym')} target="_blank" rel="noopener noreferrer">
            Remind on WhatsApp
          </a>
          <button className="ib" onClick={() => setRenewing(true)}>
            Renew
          </button>
        </>
      ) : (
        <span className="muted" style={{ fontSize: 13 }}>
          Renewed since this check-in
        </span>
      )}
      {renewing && <RenewModal member={member} onClose={() => setRenewing(false)} />}
    </div>
  )
}

export function LiveFeed() {
  const { feed, freshIds, status } = useLive()

  return (
    <section className="glass panel" aria-label="Live check-ins">
      {feed.length === 0 && (
        <div className="empty">{status === 'live' ? 'Waiting for the first check-in…' : 'Connecting to your devices…'}</div>
      )}
      {feed.map((c) => (
        <div key={c.id} className={freshIds.has(c.id) ? 'feed-row fresh' : 'feed-row'}>
          <span className="who">
            <b>{c.memberName ?? `Device user #${c.pin}`}</b>
            <br />
            <small>
              {verifyLabel(c.verifyMethod)} · {formatTime(c.punchedAt)} ({relativeTime(c.punchedAt)}) · {c.deviceName}
            </small>
          </span>
          <VerdictPill verdict={c.verdict} />
          {c.verdict === 'allowed_but_expired' && c.memberId !== null && <ExpiredActions checkin={c} />}
        </div>
      ))}
      {feed.length > 0 && (
        <div className="more">
          <Link to="/checkins" className="ib">
            All check-ins
          </Link>
        </div>
      )}
    </section>
  )
}

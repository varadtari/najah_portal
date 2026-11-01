import { useState } from 'react'

import { useOverdue } from '../api/queries'
import type { Member } from '../api/types'
import { MemberTable } from '../components/MemberTable'
import { RenewModal } from '../components/RenewModal'
import { useAuth } from '../auth/session'

// Expired members, longest-expired first (the API sorts), each with a WhatsApp reminder.
export function OverduePage() {
  const { me } = useAuth()
  const { data: members = [], isPending, error } = useOverdue()
  const [renewing, setRenewing] = useState<Member | null>(null)

  return (
    <>
      <div className="top">
        <div>
          <h2>Overdue</h2>
          <p>
            {members.length} member{members.length === 1 ? '' : 's'} need{members.length === 1 ? 's' : ''} a reminder
          </p>
        </div>
      </div>

      <div className="glass panel">
        {error && <div className="form-error" style={{ margin: 14 }}>{error.message}</div>}
        {isPending ? (
          <div className="loading">Loading…</div>
        ) : (
          <MemberTable members={members} gymName={me?.gymName ?? 'your gym'} emptyText="No overdue members. Everyone is paid up." onRenew={setRenewing} />
        )}
      </div>

      {renewing && <RenewModal member={renewing} onClose={() => setRenewing(null)} />}
    </>
  )
}

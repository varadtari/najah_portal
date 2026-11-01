import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useMembers } from '../api/queries'
import type { Member } from '../api/types'
import { AddMemberModal } from '../components/AddMemberModal'
import { MemberTable } from '../components/MemberTable'
import { RenewModal } from '../components/RenewModal'
import { useAuth } from '../auth/session'
import { useDebounced } from '../lib/useDebounced'

export function MembersPage() {
  const { me } = useAuth()
  // The search lives in the URL so Back returns to the same filtered list.
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const debouncedSearch = useDebounced(search.trim(), 250)

  const { data: members = [], isPending, error, isPlaceholderData } = useMembers(debouncedSearch)
  const [adding, setAdding] = useState(false)
  const [renewing, setRenewing] = useState<Member | null>(null)

  return (
    <>
      <div className="top">
        <div>
          <h2>Members</h2>
          <p>{debouncedSearch ? `${members.length} matching` : `${members.length} enrolled`}</p>
        </div>
        <button className="btn" onClick={() => setAdding(true)}>
          Add member
        </button>
      </div>

      <div className="glass panel">
        <div className="tools">
          <input
            type="search"
            placeholder="Search by name or phone"
            aria-label="Search members"
            value={search}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </div>
        {error && <div className="form-error" style={{ margin: 14 }}>{error.message}</div>}
        {isPending ? (
          <div className="loading">Loading…</div>
        ) : (
          <div style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
            <MemberTable
              members={members}
              gymName={me?.gymName ?? 'your gym'}
              emptyText={debouncedSearch ? 'No members match your search.' : 'No members yet. Add your first member.'}
              onRenew={setRenewing}
            />
          </div>
        )}
      </div>

      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
      {renewing && <RenewModal member={renewing} onClose={() => setRenewing(null)} />}
    </>
  )
}

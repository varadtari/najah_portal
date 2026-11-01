import type { Member } from '../api/types'
import { expiryLabel, formatPhone, whatsappReminderLink } from '../lib/format'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
    <path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 8 19.3z" />
  </svg>
)

type Props = {
  members: Member[]
  gymName: string
  emptyText: string
  onRenew: (member: Member) => void
}

// The prototype's member table: overdue rows get a WhatsApp reminder and "Mark paid", active
// rows get "Renew". On phones the CSS turns each row into a card.
export function MemberTable({ members, gymName, emptyText, onRenew }: Props) {
  if (members.length === 0) return <div className="empty">{emptyText}</div>

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Member</th>
          <th>Expires</th>
          <th>Status</th>
          <th>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          const overdue = member.status === 'overdue'
          return (
            <tr key={member.id}>
              <td className="who">
                <b>{member.name}</b>
                <span>{formatPhone(member.phone)}</span>
              </td>
              <td className="exp">{expiryLabel(member.daysToExpiry, member.endDate)}</td>
              <td className="st">
                <span className={overdue ? 'pill od' : 'pill ok'}>{overdue ? 'Overdue' : 'Active'}</span>
              </td>
              <td className="ac">
                <div className="acts">
                  {overdue && (
                    <a className="ib wa" href={whatsappReminderLink(member.phone, member.name, gymName)} target="_blank" rel="noopener noreferrer" aria-label={`Remind ${member.name} on WhatsApp`}>
                      <WhatsAppIcon />
                      Remind
                    </a>
                  )}
                  <button type="button" className="ib" onClick={() => onRenew(member)}>
                    {overdue ? 'Mark paid' : 'Renew'}
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

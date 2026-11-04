import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDashboard } from '../api/queries'
import { AddMemberModal } from '../components/AddMemberModal'
import { LiveFeed } from '../components/LiveFeed'
import { LiveStatus } from '../components/LiveStatus'
import { useAuth } from '../auth/session'
import { formatDateTime, formatInr } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function Count({ value, money = false }: { value: number; money?: boolean }) {
  const shown = useCountUp(value)
  return <>{money ? formatInr(shown) : shown}</>
}

export function DashboardPage() {
  const { me } = useAuth()
  const { data, isPending, error } = useDashboard()
  const [adding, setAdding] = useState(false)
  const [hello] = useState(() => greeting(new Date().getHours()))

  return (
    <>
      <div className="top">
        <div>
          <h2>{hello}</h2>
          <p>{me?.gymName} at a glance</p>
        </div>
        <button className="btn" onClick={() => setAdding(true)}>
          Add member
        </button>
      </div>

      <LiveStatus />

      {error && <div className="form-error">{error.message}</div>}

      <div className="metrics four">
        <div className="glass metric act">
          <div>
            <div className="k">Active members</div>
            <div className="h">Paid and in date</div>
          </div>
          <div className="v">{data ? <Count value={data.activeMembers} /> : '–'}</div>
        </div>
        <Link to="/checkins" className="glass metric" style={{ textDecoration: 'none' }}>
          <div>
            <div className="k">Check-ins today</div>
            <div className="h">From your devices</div>
          </div>
          <div className="v">{data ? <Count value={data.checkinsToday} /> : '–'}</div>
        </Link>
        <div className="glass metric">
          <div>
            <div className="k">Revenue this month</div>
            <div className="h">Cash and UPI logged</div>
          </div>
          <div className="v">{data ? <Count value={data.revenueThisMonthPaise} money /> : '–'}</div>
        </div>
        <Link to="/overdue" className="glass metric od">
          <div>
            <div className="k">Overdue fees</div>
            <div className="h">Tap to send reminders</div>
          </div>
          <div className="v">{data ? <Count value={data.overdueMembers} /> : '–'}</div>
        </Link>
      </div>

      <div className="two-col">
        <section>
          <div className="top">
            <h2 style={{ fontSize: 19 }}>Live check-ins</h2>
          </div>
          <LiveFeed />
        </section>
        <section>
          <div className="top">
            <h2 style={{ fontSize: 19 }}>Recent payments</h2>
          </div>
          <div className="glass panel">
            {isPending && <div className="loading">Loading…</div>}
            {data && data.recentPayments.length === 0 && <div className="empty">No payments yet. Add your first member to get started.</div>}
            {data?.recentPayments.map((payment) => (
              <div key={payment.id} className="pay-row">
                <span>
                  <b>{payment.memberName}</b>
                  <br />
                  <small>
                    Paid via {payment.method === 'upi' ? 'UPI' : 'Cash'} · {formatDateTime(payment.paidAt)}
                  </small>
                </span>
                <span className="amt">{formatInr(payment.amountPaise)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
    </>
  )
}

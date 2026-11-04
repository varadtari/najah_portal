import { Link } from 'react-router-dom'

import { useDevices } from '../api/queries'
import { relativeTime } from '../lib/format'
import { useLive } from '../live/live-context'

const LABELS = { live: 'Live', connecting: 'Connecting…', offline: 'Not live' } as const

// The dashboard's connection line: is the feed live, and is each device reachable.
export function LiveStatus() {
  const { status } = useLive()
  const { data: devices = [] } = useDevices()
  const offline = devices.filter((d) => d.lastSeenAt !== null && !d.online)

  return (
    <>
      {offline.length > 0 && (
        <div className="banner warn" role="alert">
          {offline.map((d) => `${d.name} has been offline since ${relativeTime(d.lastSeenAt!)}`).join(' · ')}. Check-ins are kept on the device and arrive when it
          reconnects. <Link to="/settings">Devices</Link>
        </div>
      )}
      <div className="status-row">
        <span className={`live-chip ${status}`}>
          <span className="dot" aria-hidden />
          {LABELS[status]}
        </span>
        {devices.map((d) => (
          <span key={d.id} className="device-chip">
            <b>{d.name}</b> · {d.lastSeenAt === null ? 'not connected yet' : d.online ? 'online' : 'offline'}
          </span>
        ))}
        {devices.length === 0 && (
          <span className="device-chip">
            No devices yet. <Link to="/settings">Add one</Link>
          </span>
        )}
      </div>
    </>
  )
}

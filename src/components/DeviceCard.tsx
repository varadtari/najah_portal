import { useState } from 'react'

import { useDeviceCommands, useQueueCommand, useRemoveDevice, useSyncDevice } from '../api/queries'
import type { Device, DeviceCommandKind } from '../api/types'
import { formatDateTime, relativeTime } from '../lib/format'
import { Modal } from './Modal'
import { useToast } from './toast-context'

const ADMS_SERVER = import.meta.env.VITE_ADMS_SERVER ?? ''
const ADMS_PORT = import.meta.env.VITE_ADMS_PORT ?? '8001'

const COMMAND_LABELS: Record<DeviceCommandKind, string> = {
  open_door: 'Open door',
  reboot: 'Reboot',
  info: 'Refresh device info',
  repull_logs: 'Re-pull logs',
  check: 'Check for new data',
  sync_user: 'Add or update member',
  delete_user: 'Remove member',
  restore_template: 'Restore face / fingerprint',
}

const STATUS_LABELS = { queued: 'Waiting for device', sent: 'Sent', acked: 'Done', failed: 'Failed', superseded: 'Replaced by a newer change' } as const

// Steps for the person at the device; the address comes from VITE_ADMS_SERVER.
function SetupSteps({ device }: { device: Device }) {
  return (
    <ol className="steps">
      <li>
        On the device open <b>Menu → COMM → Cloud Server Setting</b>.
      </li>
      <li>
        Set <b>Server mode</b> to <code>ADMS</code>, <b>Server address</b> to <code>{ADMS_SERVER || 'your Najah server address'}</code> and{' '}
        <b>Port</b> to <code>{ADMS_PORT}</code>. Leave HTTPS and proxy off.
      </li>
      <li>
        Check the serial under <b>Menu → System Info → Device Info</b> is <code>{device.serialNumber}</code>.
      </li>
      <li>Save, then restart the device. It connects within a minute.</li>
      <li>
        Enrol device admins with a user ID of <b>9000 or higher</b>. Lower IDs belong to members, and Najah manages them.
      </li>
    </ol>
  )
}

function StatusPill({ device }: { device: Device }) {
  if (device.lastSeenAt === null) return <span className="pill wait">Waiting to connect</span>
  return device.online ? <span className="pill ok">Online</span> : <span className="pill od">Offline</span>
}

export function DeviceCard({ device }: { device: Device }) {
  const queue = useQueueCommand(device.id)
  const remove = useRemoveDevice()
  const sync = useSyncDevice(device.id)
  const toast = useToast()
  const [showHistory, setShowHistory] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { data: commands = [] } = useDeviceCommands(device.id, showHistory)

  const neverConnected = device.lastSeenAt === null

  async function send(kind: DeviceCommandKind) {
    try {
      // Re-pull asks the device to resend the last 24 hours of punches; duplicates are ignored.
      const from = kind === 'repull_logs' ? new Date(Date.now() - 24 * 3600_000).toISOString() : undefined
      await queue.mutateAsync({ kind, from })
      toast(`${COMMAND_LABELS[kind]} sent. It runs on the device's next check-in (about 10 seconds).`)
      setShowHistory(true)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="glass card">
      <div className="card-head">
        <div>
          <h3>{device.name}</h3>
          <small>Serial {device.serialNumber}</small>
        </div>
        <StatusPill device={device} />
      </div>

      {neverConnected ? (
        <>
          <SetupSteps device={device} />
          {device.serialLastAttemptAt ? (
            <div className="hint warn" role="status">
              A device with this serial tried to connect {relativeTime(device.serialLastAttemptAt)}, before it was added. It should connect on its next
              retry (within a minute).
            </div>
          ) : (
            <div className="hint warn" role="status">
              Waiting for the device to connect… If nothing happens after a few minutes, check the server address and that the device has internet.
            </div>
          )}
        </>
      ) : (
        <div className="facts">
          <div>
            Last seen<b>{relativeTime(device.lastSeenAt!)}</b>
          </div>
          <div>
            Last check-in<b>{device.lastPunchAt ? relativeTime(device.lastPunchAt) : 'None yet'}</b>
          </div>
          <div>
            Waiting commands<b>{device.pendingCommands}</b>
          </div>
          <div>
            Network<b>{device.lastIp ?? '–'}</b>
          </div>
        </div>
      )}

      <div className="acts" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
        <button className="ib" onClick={() => send('open_door')} disabled={neverConnected || queue.isPending}>
          Open door
        </button>
        <button className="ib" onClick={() => send('repull_logs')} disabled={neverConnected || queue.isPending}>
          Re-pull last 24 h
        </button>
        <button className="ib" onClick={() => send('reboot')} disabled={neverConnected || queue.isPending}>
          Reboot
        </button>
        <button
          className="ib"
          disabled={sync.isPending}
          title="Send every member to this device again, e.g. after it was reset"
          onClick={async () => {
            try {
              const result = await sync.mutateAsync()
              toast(`${result.commandsQueued} member update${result.commandsQueued === 1 ? '' : 's'} sent to ${device.name}.`)
              setShowHistory(true)
            } catch (err) {
              toast((err as Error).message, 'error')
            }
          }}
        >
          Sync members
        </button>
        <button className="ib" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? 'Hide history' : 'Command history'}
        </button>
        <button className="ib" onClick={() => setConfirmRemove(true)}>
          Remove
        </button>
      </div>

      {showHistory && (
        <div className="cmd-list" aria-label="Command history">
          {commands.length === 0 && <div className="muted">No commands yet.</div>}
          {commands.map((c) => (
            <div key={c.id}>
              <span>
                {COMMAND_LABELS[c.kind]} <span className="muted">· {formatDateTime(c.createdAt)}</span>
              </span>
              <b className={c.status === 'failed' ? 'muted' : undefined}>{STATUS_LABELS[c.status]}</b>
            </div>
          ))}
        </div>
      )}

      {confirmRemove && (
        <Modal title={`Remove ${device.name}?`} onClose={() => setConfirmRemove(false)}>
          <h3>Remove {device.name}?</h3>
          <p className="sub">The device stops being accepted and its waiting commands are cancelled. Its past check-ins stay in the history.</p>
          {remove.error && <div className="form-error">{remove.error.message}</div>}
          <div className="row">
            <button className="btn ghost" onClick={() => setConfirmRemove(false)}>
              Cancel
            </button>
            <button
              className="btn danger"
              disabled={remove.isPending}
              onClick={async () => {
                try {
                  await remove.mutateAsync(device.id)
                  toast(`${device.name} removed`)
                } catch {
                  // shown from remove.error
                }
              }}
            >
              Remove device
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

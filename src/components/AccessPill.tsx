import type { MemberAccess } from '../api/types'

const LABELS = {
  on_device: { text: 'On device', className: 'pill ok' },
  blocked: { text: 'Blocked', className: 'pill od' },
  syncing: { text: 'Syncing…', className: 'pill wait' },
  not_on_device: { text: 'Not on device', className: 'pill unk' },
  error: { text: 'Device error', className: 'pill od' },
} as const

// Whether the gym's devices currently let the member in. Nothing is shown before any device
// is added.
export function AccessPill({ access }: { access?: MemberAccess }) {
  if (!access || access.state === 'no_devices') return null
  const label = LABELS[access.state]
  const title =
    access.state === 'error'
      ? `The device keeps refusing this member (${access.error ?? 'unknown error'}). Try Sync members in Settings.`
      : access.state === 'syncing'
        ? 'Waiting for the device to confirm. It updates on its next check-in.'
        : undefined
  return (
    <span className={label.className} title={title}>
      {label.text}
    </span>
  )
}

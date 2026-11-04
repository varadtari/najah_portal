import { useState, type FormEvent } from 'react'

import { useGym, useUpdateGym } from '../api/queries'
import { useToast } from './toast-context'

// The owner's rules for who the devices let in.
export function AccessRules() {
  const { data: gym } = useGym()
  const update = useUpdateGym()
  const toast = useToast()
  const [grace, setGrace] = useState<string | null>(null)

  if (!gym) return null
  const graceValue = grace ?? String(gym.graceDays)

  async function save(input: { graceDays?: number; blockOnExpiry?: boolean }, message: string) {
    try {
      await update.mutateAsync(input)
      setGrace(null)
      toast(message)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  function onSaveGrace(event: FormEvent) {
    event.preventDefault()
    const days = Number(graceValue)
    if (!Number.isInteger(days) || days < 0 || days > 60) {
      toast('Grace days must be a whole number from 0 to 60', 'error')
      return
    }
    save({ graceDays: days }, `Grace period set to ${days} day${days === 1 ? '' : 's'}. Devices update within a minute.`)
  }

  return (
    <div className="glass card">
      <h3 style={{ margin: '0 0 4px' }}>Access rules</h3>
      <p className="sub" style={{ marginBottom: 0 }}>
        When a membership ends, the member is removed from your devices and the door no longer opens for them. Renewing puts them back straight away, with
        their face already enrolled.
      </p>

      <label className="toggle">
        <input
          type="checkbox"
          checked={gym.blockOnExpiry}
          disabled={update.isPending}
          onChange={(e) =>
            save(
              { blockOnExpiry: e.target.checked },
              e.target.checked ? 'Expired members will be blocked at the door.' : 'Expired members can still enter. Nobody is blocked.',
            )
          }
        />
        Block entry when a membership expires
      </label>

      <form className="grace" onSubmit={onSaveGrace}>
        <div>
          <label htmlFor="grace">Grace days after expiry</label>
          <input id="grace" type="number" min={0} max={60} value={graceValue} onChange={(e) => setGrace(e.target.value)} disabled={!gym.blockOnExpiry} />
        </div>
        <button className="btn ghost" type="submit" disabled={update.isPending || !gym.blockOnExpiry || graceValue === String(gym.graceDays)}>
          Save
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
        {gym.blockOnExpiry
          ? gym.graceDays === 0
            ? 'Members are blocked the day after their membership ends.'
            : `Members can still enter for ${gym.graceDays} day${gym.graceDays === 1 ? '' : 's'} after their membership ends.`
          : 'Blocking is off: the door opens for every member, paid or not.'}
      </p>
    </div>
  )
}

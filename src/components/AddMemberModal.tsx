import { useState, type FormEvent } from 'react'

import { useAddMember, usePlans } from '../api/queries'
import type { PaymentMethod } from '../api/types'
import { formatDate } from '../lib/format'
import { Modal } from './Modal'
import { MethodToggle, PlanSelect } from './PlanFields'
import { useToast } from './toast-context'

// The prototype's Add member modal: the member starts today and the first payment is logged.
export function AddMemberModal({ onClose }: { onClose: () => void }) {
  const { data: plans = [] } = usePlans()
  const activePlans = plans.filter((p) => p.active)
  const addMember = useAddMember()
  const toast = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [planId, setPlanId] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const selectedPlanId = planId ?? activePlans[0]?.id ?? null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (selectedPlanId === null) return
    try {
      const member = await addMember.mutateAsync({ name: name.trim(), phone, planId: selectedPlanId, method })
      toast(`${member.name} added · active until ${formatDate(member.endDate!)}`)
      onClose()
    } catch {
      // The error is shown inside the form from addMember.error.
    }
  }

  return (
    <Modal title="Add member" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <h3>Add member</h3>
        <p className="sub" style={{ marginBottom: 0 }}>
          Starts today and logs the first payment.
        </p>

        <label htmlFor="member-name">Full name</label>
        <input id="member-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Naik" autoComplete="off" autoFocus required maxLength={120} />

        <label htmlFor="member-phone">Phone number</label>
        <input id="member-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" required maxLength={20} />

        {activePlans.length > 0 ? (
          <PlanSelect plans={activePlans} value={selectedPlanId} onChange={setPlanId} />
        ) : (
          <div className="form-error">No plans are on sale. Ask the owner to add one in Settings.</div>
        )}
        <MethodToggle value={method} onChange={setMethod} />

        {addMember.error && (
          <div className="form-error" role="alert">
            {addMember.error.message}
          </div>
        )}

        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={addMember.isPending || !name.trim() || !phone.trim() || selectedPlanId === null}>
            {addMember.isPending ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

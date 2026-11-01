import { useState, type FormEvent } from 'react'

import { usePlans, useRenewMember } from '../api/queries'
import type { Member, PaymentMethod } from '../api/types'
import { formatDate, formatInr } from '../lib/format'
import { Modal } from './Modal'
import { MethodToggle, PlanSelect } from './PlanFields'
import { useToast } from './toast-context'

// The prototype's Mark paid / Renew modal. The server decides the new term (an expired member
// restarts today, an active one extends) and the toast reports the date it chose.
export function RenewModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { data: plans = [] } = usePlans()
  const activePlans = plans.filter((p) => p.active)
  const renew = useRenewMember()
  const toast = useToast()

  const [planId, setPlanId] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const selectedPlanId = planId ?? activePlans[0]?.id ?? null
  const selectedPlan = activePlans.find((p) => p.id === selectedPlanId)
  const overdue = member.status === 'overdue'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (selectedPlanId === null) return
    try {
      const renewed = await renew.mutateAsync({ memberId: member.id, planId: selectedPlanId, method })
      toast(`Payment logged · ${renewed.name} active until ${formatDate(renewed.endDate!)}`)
      onClose()
    } catch {
      // Shown inside the form from renew.error.
    }
  }

  return (
    <Modal title={`${overdue ? 'Mark paid' : 'Renew'}: ${member.name}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <h3>
          {overdue ? 'Mark paid' : 'Renew'}: {member.name}
        </h3>
        <p className="sub" style={{ marginBottom: 0 }}>
          {member.endDate === null
            ? 'No current membership. New term starts today.'
            : overdue
              ? `Expired on ${formatDate(member.endDate)}. New term starts today.`
              : `Extends from ${formatDate(member.endDate)}.`}
        </p>

        <PlanSelect plans={activePlans} value={selectedPlanId} onChange={setPlanId} />
        <MethodToggle value={method} onChange={setMethod} />

        {selectedPlan && (
          <div className="summary-line">
            Collect <b>{formatInr(selectedPlan.pricePaise)}</b> by <b>{method === 'cash' ? 'cash' : 'UPI'}</b>
          </div>
        )}

        {renew.error && (
          <div className="form-error" role="alert">
            {renew.error.message}
          </div>
        )}

        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={renew.isPending || selectedPlanId === null}>
            {renew.isPending ? 'Saving…' : 'Log payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

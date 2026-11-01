import type { PaymentMethod, Plan } from '../api/types'
import { formatInr } from '../lib/format'

export function PlanSelect({ plans, value, onChange }: { plans: Plan[]; value: number | null; onChange: (planId: number) => void }) {
  return (
    <>
      <label htmlFor="plan">Plan</label>
      <select id="plan" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} required>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} – {formatInr(plan.pricePaise)}
          </option>
        ))}
      </select>
    </>
  )
}

export function MethodToggle({ value, onChange }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <>
      <label id="method-label">Payment received</label>
      <div className="seg" role="group" aria-labelledby="method-label">
        <button type="button" aria-pressed={value === 'cash'} onClick={() => onChange('cash')}>
          Paid via Cash
        </button>
        <button type="button" aria-pressed={value === 'upi'} onClick={() => onChange('upi')}>
          Paid via UPI
        </button>
      </div>
    </>
  )
}

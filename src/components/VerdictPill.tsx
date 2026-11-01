import type { Verdict } from '../api/types'

const LABELS: Record<Verdict, { text: string; className: string }> = {
  allowed: { text: 'Allowed', className: 'pill ok' },
  allowed_but_expired: { text: 'Entered while expired', className: 'pill od' },
  denied_expired: { text: 'Denied – expired', className: 'pill od' },
  unknown: { text: 'Not a member', className: 'pill unk' },
  denied_unknown: { text: 'Unknown face', className: 'pill unk' },
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const label = LABELS[verdict] ?? { text: verdict, className: 'pill unk' }
  return <span className={label.className}>{label.text}</span>
}

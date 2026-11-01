// Types mirror the essl_integration_service models. Money is integer paise; dates are
// YYYY-MM-DD calendar days in the gym's timezone.

export type Role = 'superadmin' | 'owner' | 'staff'

export type Me = {
  userId: number
  name: string
  email: string
  role: Role
  gymId: number | null
  gymName: string | null
}

export type PaymentMethod = 'cash' | 'upi'
export type MemberStatus = 'active' | 'overdue'

export type Gym = {
  id: number
  name: string
  timezone: string
  graceDays: number
  blockOnExpiry: boolean
  billingStatus: 'trial' | 'paid' | 'unpaid'
}

export type Plan = {
  id: number
  name: string
  months: number
  pricePaise: number
  active: boolean
}

export type Member = {
  id: number
  devicePin: number
  name: string
  phone: string
  startDate: string | null
  endDate: string | null
  status: MemberStatus
  /** Negative once expired: -3 means it expired three days ago. */
  daysToExpiry: number | null
}

export type Membership = {
  id: number
  planId: number
  planName: string
  startDate: string
  endDate: string
}

export type Payment = {
  id: number
  memberId: number
  memberName: string
  membershipId: number
  amountPaise: number
  method: PaymentMethod
  paidAt: string
}

export type MemberDetail = Member & {
  memberships: Membership[]
  payments: Payment[]
}

export type DashboardSummary = {
  today: string
  activeMembers: number
  overdueMembers: number
  checkinsToday: number
  revenueThisMonthPaise: number
  recentPayments: Payment[]
}

export type Device = {
  id: number
  serialNumber: string
  name: string
  firmware: string | null
  pushVersion: string | null
  lastSeenAt: string | null
  lastIp: string | null
  online: boolean
  pendingCommands: number
  lastPunchAt: string | null
  /** Set only on a device that never connected: when its serial last tried, unregistered. */
  serialLastAttemptAt?: string | null
  createdAt: string
}

export type DeviceCommandKind = 'open_door' | 'reboot' | 'info' | 'repull_logs' | 'check'

export type DeviceCommand = {
  id: number
  kind: DeviceCommandKind
  command: string
  status: 'queued' | 'sent' | 'acked' | 'failed'
  attempts: number
  returnCode: number | null
  sentAt: string | null
  finishedAt: string | null
  createdAt: string
  requestedBy: number | null
}

export type Verdict = 'allowed' | 'allowed_but_expired' | 'unknown' | 'denied_expired' | 'denied_unknown'

export type Checkin = {
  id: number
  deviceId: number
  deviceName: string
  memberId: number | null
  memberName: string | null
  pin: string
  punchedAt: string
  verifyMethod: string
  verdict: Verdict
}

export type CheckinPage = {
  checkins: Checkin[]
  nextCursor: string | null
}

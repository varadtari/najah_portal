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
  revenueThisMonthPaise: number
  recentPayments: Payment[]
}

import { vi } from 'vitest'

import type { DashboardSummary, Me, Member, Plan } from '../api/types'

// An in-memory stand-in for essl_integration_service, enough to drive the app's flows in jsdom.
// It speaks the real response shape: {type, message} or an ApplicationError.

export const owner: Me = { userId: 3, name: 'Savio', email: 'owner@panaji.local', role: 'owner', gymId: 1, gymName: 'Panaji Iron Works' }
export const superadmin: Me = { userId: 2, name: 'Client Admin', email: 'admin@najah.local', role: 'superadmin', gymId: null, gymName: null }

export const plans: Plan[] = [
  { id: 1, name: '1 month', months: 1, pricePaise: 120000, active: true },
  { id: 2, name: '3 months', months: 3, pricePaise: 330000, active: true },
]

export function member(overrides: Partial<Member>): Member {
  return { id: 1, devicePin: 1, name: 'Rohan Naik', phone: '9822011101', startDate: '2026-10-01', endDate: '2026-11-01', status: 'active', daysToExpiry: 30, ...overrides }
}

type State = { session: Me | null; accounts: Record<string, Me>; members: Member[]; requests: string[] }

const ok = (message: unknown, status = 200) => new Response(JSON.stringify({ type: 'success', message }), { status })
const fail = (status: number, displayMessage: string) =>
  new Response(JSON.stringify({ type: 'error', requestId: 'test', message: { errorCode: 1, displayMessage } }), { status })

export function installFakeApi(initial: Partial<State> = {}) {
  const state: State = { session: null, accounts: { [owner.email]: owner, [superadmin.email]: superadmin }, members: [], requests: [], ...initial }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    const path = url.pathname.replace(/^\/api/, '')
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    state.requests.push(`${method} ${path}`)

    if (path === '/v1/auth/login' && method === 'POST') {
      const account = state.accounts[body.email]
      if (!account || body.password !== 'right-password') return fail(401, 'Email or password is incorrect')
      state.session = account
      return ok(account)
    }
    if (path === '/v1/auth/logout') {
      state.session = null
      return ok('signed out')
    }
    if (!state.session) return fail(401, 'Please sign in')
    if (path === '/v1/me') return ok(state.session)
    if (state.session.role === 'superadmin') return fail(403, 'You do not have access to this page')

    const overdue = state.members.filter((m) => m.status === 'overdue')
    if (path === '/v1/dashboard/summary') {
      const summary: DashboardSummary = {
        today: '2026-11-01',
        activeMembers: state.members.length - overdue.length,
        overdueMembers: overdue.length,
        revenueThisMonthPaise: 240000,
        recentPayments: [],
      }
      return ok(summary)
    }
    if (path === '/v1/plans') return ok(plans)
    if (path === '/v1/overdue') return ok(overdue)
    if (path === '/v1/members' && method === 'GET') {
      const search = (url.searchParams.get('search') ?? '').toLowerCase()
      return ok(state.members.filter((m) => (m.name + m.phone).toLowerCase().includes(search)))
    }
    if (path === '/v1/members' && method === 'POST') {
      if (!/^\d{10}$/.test(body.phone)) return fail(400, 'Enter a valid 10-digit mobile number')
      const created = member({ id: state.members.length + 1, devicePin: state.members.length + 1, name: body.name, phone: body.phone, startDate: '2026-11-01', endDate: '2026-12-01' })
      state.members.push(created)
      return ok(created, 201)
    }
    const renew = path.match(/^\/v1\/members\/(\d+)\/renew$/)
    if (renew && method === 'POST') {
      const target = state.members.find((m) => m.id === Number(renew[1]))!
      Object.assign(target, { status: 'active', daysToExpiry: 30, startDate: '2026-11-01', endDate: '2026-12-01' })
      return ok(target, 201)
    }
    return fail(404, 'Not found')
  })

  vi.stubGlobal('fetch', fetchMock)
  return state
}

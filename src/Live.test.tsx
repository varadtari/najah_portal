// @vitest-environment jsdom
import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkin, device, installFakeApi, member, owner, superadmin } from './test/fakeApi'
import { FakeEventSource } from './test/fakeEventSource'
import { renderApp } from './test/renderApp'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  window.matchMedia ??= ((query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} })) as never
})

beforeEach(() => FakeEventSource.install())

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const feed = () => screen.getByRole('region', { name: 'Live check-ins' })

describe('live dashboard', () => {
  it('opens one stream with cookies and shows the connection as live', async () => {
    installFakeApi({ session: owner })
    renderApp('/')
    await screen.findByText('Active members')

    const source = FakeEventSource.latest()
    expect(source.url).toBe('/api/v1/events/stream')
    expect(source.withCredentials).toBe(true)
    expect(screen.getByText('Connecting…')).toBeTruthy()

    act(() => source.emit('ready', { gymId: 1 }))
    expect(await screen.findByText('Live')).toBeTruthy()
    expect(screen.getByText('Waiting for the first check-in…')).toBeTruthy()
  })

  it('a punch appears at the top of the feed and refreshes the dashboard numbers', async () => {
    const api = installFakeApi({ session: owner, checkins: [checkin({ id: 1, memberName: 'Savio Fernandes', punchedAt: '2026-11-04T06:00:00Z' })] })
    renderApp('/')
    await screen.findByRole('region', { name: 'Live check-ins' })
    expect(await within(feed()).findByText('Savio Fernandes')).toBeTruthy()

    const fresh = checkin({ id: 2, memberName: 'Rohan Naik', punchedAt: '2026-11-04T06:30:00Z' })
    api.checkins.push(fresh)
    const summaryCalls = api.requests.filter((r) => r === 'GET /v1/dashboard/summary').length

    act(() => FakeEventSource.latest().emit('checkin', fresh))

    const rows = within(feed()).getAllByText(/Rohan Naik|Savio Fernandes/)
    expect(rows[0].textContent).toBe('Rohan Naik')
    expect(rows[0].closest('.feed-row')!.classList.contains('fresh')).toBe(true)

    await waitFor(() => expect(api.requests.filter((r) => r === 'GET /v1/dashboard/summary').length).toBeGreaterThan(summaryCalls), { timeout: 3000 })
  })

  it('an expired member at the door can be renewed or reminded from the feed', async () => {
    installFakeApi({ session: owner, members: [member({ id: 7, name: 'Priya Kamat', status: 'overdue', daysToExpiry: -3, endDate: '2026-11-01' })] })
    renderApp('/')
    await screen.findByText('Active members')

    act(() => FakeEventSource.latest().emit('checkin', checkin({ id: 9, memberId: 7, memberName: 'Priya Kamat', verdict: 'allowed_but_expired' })))

    expect(await within(feed()).findByText('Entered while expired')).toBeTruthy()
    const remind = (await within(feed()).findByRole('link', { name: 'Remind on WhatsApp' })) as HTMLAnchorElement
    expect(remind.href).toContain('https://wa.me/91')

    await userEvent.setup().click(within(feed()).getByRole('button', { name: 'Renew' }))
    expect(within(screen.getByRole('dialog')).getByText('Mark paid: Priya Kamat')).toBeTruthy()
  })

  it('a refresh reloads the feed', async () => {
    const api = installFakeApi({ session: owner })
    renderApp('/')
    await screen.findByText('Active members')

    api.checkins.push(checkin({ id: 5, memberName: 'Tanvi Borkar' }))
    act(() => FakeEventSource.latest().emit('refresh'))

    expect(await within(feed()).findByText('Tanvi Borkar')).toBeTruthy()
  })

  it('signedout closes the stream and returns to the login screen', async () => {
    installFakeApi({ session: owner })
    renderApp('/')
    await screen.findByText('Active members')
    const source = FakeEventSource.latest()

    act(() => source.emit('signedout'))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
    expect(source.readyState).toBe(FakeEventSource.CLOSED)
  })

  it('a stream error checks the session and signs out if it ended', async () => {
    const api = installFakeApi({ session: owner })
    renderApp('/')
    await screen.findByText('Active members')

    api.session = null
    act(() => FakeEventSource.latest().onerror?.(new Event('error')))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
  })

  it('warns when a device is offline and shows each device', async () => {
    installFakeApi({
      session: owner,
      devices: [
        device({ id: 1, name: 'Front door', lastSeenAt: new Date(Date.now() - 600_000).toISOString(), online: false }),
        device({ id: 2, name: 'Back door', serialNumber: 'X2', lastSeenAt: new Date().toISOString(), online: true }),
      ],
    })
    renderApp('/')

    expect((await screen.findByRole('alert')).textContent).toMatch(/Front door has been offline since 10 min ago/)
    expect(screen.getByText(/· online/)).toBeTruthy()
  })

  it('the superadmin opens no stream', async () => {
    installFakeApi({ session: superadmin })
    renderApp('/admin')
    await screen.findByRole('heading', { name: 'Gyms' })
    expect(FakeEventSource.instances).toHaveLength(0)
  })
})

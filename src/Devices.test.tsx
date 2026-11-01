// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { checkin, device, installFakeApi, owner } from './test/fakeApi'
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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('devices', () => {
  it('an owner adds a device and gets setup steps while it waits to connect', async () => {
    const api = installFakeApi({ session: owner })
    renderApp('/settings')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Serial number'), 'cqz 7224460014')
    await user.click(screen.getByRole('button', { name: 'Add device' }))

    expect(await screen.findByText('Waiting to connect')).toBeTruthy()
    expect(screen.getByText(/Cloud Server Setting/)).toBeTruthy()
    expect(screen.getAllByText('CQZ7224460014').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Open door' }).hasAttribute('disabled')).toBe(true)

    // The device connects; the next poll (every 3 s while waiting) flips the card.
    Object.assign(api.devices[0], { lastSeenAt: new Date().toISOString(), online: true, lastIp: '192.168.1.20' })
    expect(await screen.findByText('Online', {}, { timeout: 5000 })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open door' }).hasAttribute('disabled')).toBe(false)
  }, 10_000)

  it('says when the serial tried to connect before it was added', async () => {
    installFakeApi({ session: owner, devices: [device({ serialLastAttemptAt: new Date(Date.now() - 120_000).toISOString() })] })
    renderApp('/settings')
    expect(await screen.findByText(/tried to connect 2 min ago, before it was added/)).toBeTruthy()
  })

  it('shows the server message for a serial registered elsewhere', async () => {
    installFakeApi({ session: owner, devices: [device({})] })
    renderApp('/settings')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Serial number'), 'CQZ7224460014')
    await user.click(screen.getByRole('button', { name: 'Add device' }))

    expect((await screen.findByRole('alert')).textContent).toBe('This device is already registered.')
  })

  it('opens the door and shows the command in the history', async () => {
    const api = installFakeApi({ session: owner, devices: [device({ lastSeenAt: new Date().toISOString(), online: true })] })
    renderApp('/settings')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Open door' }))

    expect((await screen.findByRole('status', {}, { timeout: 2000 })).textContent).toBeDefined()
    expect(api.requests).toContain('POST /v1/devices/1/commands')
    const history = await screen.findByLabelText('Command history')
    expect(within(history).getByText(/Open door/)).toBeTruthy()
    expect(within(history).getByText('Waiting for device')).toBeTruthy()
  })

  it('removes a device after confirming in a dialog', async () => {
    const api = installFakeApi({ session: owner, devices: [device({ lastSeenAt: new Date().toISOString(), online: true })] })
    renderApp('/settings')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove device' }))

    await waitFor(() => expect(screen.queryByText('Front door')).toBeNull())
    expect(api.devices).toHaveLength(0)
  })

  it('staff have no Settings, but do have Check-ins', async () => {
    installFakeApi({ session: { ...owner, role: 'staff' } })
    renderApp('/')
    await screen.findByText('Active members')
    const nav = screen.getAllByRole('navigation', { name: 'Main navigation' })[0]
    expect(within(nav).queryByRole('link', { name: 'Settings' })).toBeNull()
    expect(within(nav).getByRole('link', { name: 'Check-ins' })).toBeTruthy()
  })
})

describe('check-ins', () => {
  it('lists punches with their result and filters by it', async () => {
    installFakeApi({
      session: owner,
      checkins: [
        checkin({ id: 1 }),
        checkin({ id: 2, memberId: 2, memberName: 'Priya Kamat', verdict: 'allowed_but_expired', verifyMethod: 'fingerprint' }),
        checkin({ id: 3, memberId: null, memberName: null, pin: '999', verdict: 'unknown' }),
      ],
    })
    renderApp('/checkins')
    const user = userEvent.setup()

    expect(await screen.findByText('Rohan Naik')).toBeTruthy()
    expect(screen.getByText('Device user #999')).toBeTruthy()
    expect(screen.getAllByText('Not a member').some((el) => el.classList.contains('pill'))).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Entered while expired' }))

    await waitFor(() => expect(screen.queryByText('Rohan Naik')).toBeNull())
    expect(screen.getByText('Priya Kamat')).toBeTruthy()
  })

  it('the dashboard counts today’s check-ins', async () => {
    installFakeApi({ session: owner, checkins: [checkin({ id: 1 }), checkin({ id: 2 })] })
    renderApp('/')
    const card = (await screen.findByText('Check-ins today')).closest('a')!
    await waitFor(() => expect(within(card).getByText('2')).toBeTruthy())
  })
})

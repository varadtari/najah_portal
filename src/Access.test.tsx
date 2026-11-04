// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { device, installFakeApi, member, owner } from './test/fakeApi'
import { FakeEventSource } from './test/fakeEventSource'
import { renderApp } from './test/renderApp'

beforeEach(() => FakeEventSource.install())

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

function rowOf(name: string) {
  return screen.getByText(name).closest('tr')!
}

describe('door access', () => {
  it('shows each member’s access on the devices', async () => {
    installFakeApi({
      session: owner,
      members: [
        member({ id: 1, name: 'Savio Fernandes', access: { state: 'on_device', devices: 1 } }),
        member({ id: 2, name: 'Priya Kamat', status: 'overdue', daysToExpiry: -3, access: { state: 'blocked', devices: 1 } }),
        member({ id: 3, name: 'Tanvi Borkar', access: { state: 'syncing', devices: 1 } }),
        member({ id: 4, name: 'Rohan Naik', access: { state: 'error', devices: 1, error: 'device returned -1002' } }),
        member({ id: 5, name: 'Cedric Rodrigues', access: { state: 'no_devices', devices: 0 } }),
      ],
    })
    renderApp('/members')

    expect(within(await screen.findByText('Savio Fernandes').then(() => rowOf('Savio Fernandes'))).getByText('On device')).toBeTruthy()
    expect(within(rowOf('Priya Kamat')).getByText('Blocked')).toBeTruthy()
    expect(within(rowOf('Tanvi Borkar')).getByText('Syncing…')).toBeTruthy()
    expect(within(rowOf('Rohan Naik')).getByText('Device error').getAttribute('title')).toContain('device returned -1002')
    expect(within(rowOf('Cedric Rodrigues')).queryByText(/device/i)).toBeNull()
  })

  it('the owner turns blocking off and back on, and sets grace days', async () => {
    const api = installFakeApi({ session: owner })
    renderApp('/settings')
    const user = userEvent.setup()

    const toggle = (await screen.findByLabelText('Block entry when a membership expires')) as HTMLInputElement
    expect(toggle.checked).toBe(true)
    expect(screen.getByText('Members are blocked the day after their membership ends.')).toBeTruthy()

    await user.click(toggle)
    await waitFor(() => expect(api.gym.blockOnExpiry).toBe(false))
    expect(await screen.findByText(/Blocking is off/)).toBeTruthy()
    expect((screen.getByLabelText('Grace days after expiry') as HTMLInputElement).disabled).toBe(true)

    await user.click(toggle)
    await waitFor(() => expect(api.gym.blockOnExpiry).toBe(true))

    const grace = screen.getByLabelText('Grace days after expiry')
    await user.clear(grace)
    await user.type(grace, '3')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(api.gym.graceDays).toBe(3))
    expect(await screen.findByText('Members can still enter for 3 days after their membership ends.')).toBeTruthy()
    expect(api.requests.filter((r) => r === 'PATCH /v1/gym')).toHaveLength(3)
  })

  it('Sync members resends everyone to a device', async () => {
    const api = installFakeApi({ session: owner, members: [member({ id: 1 }), member({ id: 2 })], devices: [device({ lastSeenAt: new Date().toISOString(), online: true })] })
    renderApp('/settings')

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Sync members' }))

    expect(api.requests).toContain('POST /v1/devices/1/sync')
    expect((await screen.findByRole('status')).textContent).toContain('2 member updates sent to Front door')
  })

  it('setup steps tell installers to keep admins above member ids', async () => {
    installFakeApi({ session: owner, devices: [device({})] })
    renderApp('/settings')
    expect(await screen.findByText(/9000 or higher/)).toBeTruthy()
  })
})

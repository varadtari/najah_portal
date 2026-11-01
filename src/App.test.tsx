// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { installFakeApi, member, owner, superadmin } from './test/fakeApi'
import { renderApp } from './test/renderApp'

beforeAll(() => {
  // jsdom has no <dialog> behaviour or matchMedia.
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

async function signIn(email: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), 'right-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  return user
}

describe('signing in and out', () => {
  it('sends a signed-out visitor to the login screen', async () => {
    installFakeApi()
    renderApp('/members')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
  })

  it('an owner signs in and lands on the dashboard without reloading', async () => {
    installFakeApi({ members: [member({ id: 1 }), member({ id: 2, name: 'Priya Kamat', status: 'overdue', daysToExpiry: -3 })] })
    renderApp('/login')

    await signIn(owner.email)

    expect(await screen.findByText('Panaji Iron Works at a glance')).toBeTruthy()
    expect(await screen.findByText('Active members')).toBeTruthy()
  })

  it('a superadmin signs in, sees Gyms, signs out and gets the login screen back', async () => {
    const api = installFakeApi()
    renderApp('/login')

    const user = await signIn(superadmin.email)
    expect(await screen.findByRole('heading', { name: 'Gyms' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
    expect(api.requests).not.toContain('GET /v1/dashboard/summary')
  })

  it('a wrong password shows the server message', async () => {
    installFakeApi()
    renderApp('/login')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), owner.email)
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Email or password is incorrect')
  })

  it('a session that ends mid-use returns to the login screen', async () => {
    const api = installFakeApi({ session: owner })
    renderApp('/members')
    await screen.findByRole('heading', { name: 'Members' })

    // The session ends server-side; the next request (opening the modal loads plans) gets a 401.
    api.session = null
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add member' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
  })
})

describe('members', () => {
  it('adds a member through the modal and lists them', async () => {
    installFakeApi({ session: owner })
    renderApp('/members')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Add member' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Full name'), 'Tanvi Borkar')
    await user.type(within(dialog).getByLabelText('Phone number'), '9604055507')
    await user.click(within(dialog).getByRole('button', { name: 'Paid via UPI' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

    expect(await screen.findByText('Tanvi Borkar')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((await screen.findByRole('status')).textContent).toContain('Tanvi Borkar added')
  })

  it('shows the server validation message in the modal', async () => {
    installFakeApi({ session: owner })
    renderApp('/members')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Add member' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Full name'), 'X')
    await user.type(within(dialog).getByLabelText('Phone number'), '123')
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

    expect((await within(dialog).findByRole('alert')).textContent).toBe('Enter a valid 10-digit mobile number')
  })

  it('overdue members get a WhatsApp reminder and Mark paid clears them', async () => {
    installFakeApi({ session: owner, members: [member({ id: 1, name: 'Priya Kamat', status: 'overdue', daysToExpiry: -3, endDate: '2026-10-29' })] })
    renderApp('/overdue')
    const user = userEvent.setup()

    expect(await screen.findByText('Expired 3 days ago')).toBeTruthy()
    const remind = screen.getByRole('link', { name: 'Remind Priya Kamat on WhatsApp' }) as HTMLAnchorElement
    expect(remind.href).toContain('https://wa.me/919822011101')

    await user.click(screen.getByRole('button', { name: 'Mark paid' }))
    expect(within(screen.getByRole('dialog')).getByText('Expired on 29 Oct 2026. New term starts today.')).toBeTruthy()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Log payment' }))

    await waitFor(() => expect(screen.getByText('No overdue members. Everyone is paid up.')).toBeTruthy())
  })
})

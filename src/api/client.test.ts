import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, errorMessageFor } from './client'

describe('errorMessageFor', () => {
  it("uses the server's displayMessage when present", () => {
    expect(errorMessageFor(400, { message: { displayMessage: 'Enter a valid 10-digit mobile number' } })).toBe('Enter a valid 10-digit mobile number')
  })

  it('falls back to a message for the status', () => {
    expect(errorMessageFor(409, { message: { displayMessage: '  ' } })).toMatch(/changed by someone else/)
    expect(errorMessageFor(500, null)).toBe('Something went wrong. Please try again.')
  })
})

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('returns the message of a success response and sends cookies', async () => {
    const fetchMock = stubFetch(200, { type: 'success', message: { id: 7 } })

    await expect(api<{ id: number }>('/v1/members/7')).resolves.toEqual({ id: 7 })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/members/7')
    expect(init.credentials).toBe('include')
  })

  it('sends JSON bodies', async () => {
    const fetchMock = stubFetch(201, { type: 'success', message: {} })

    await api('/v1/members', { method: 'POST', body: { name: 'Rohan' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe('{"name":"Rohan"}')
  })

  it('throws ApiError with the display message and status', async () => {
    stubFetch(404, { type: 'error', requestId: 'r-1', message: { errorCode: 42, displayMessage: 'Member not found' } })

    const err = (await api('/v1/members/9').catch((e: unknown) => e)) as ApiError

    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
    expect(err.message).toBe('Member not found')
    expect(err.requestId).toBe('r-1')
  })

  it('reports a network failure as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const err = (await api('/v1/me').catch((e: unknown) => e)) as ApiError

    expect(err.status).toBe(0)
    expect(err.message).toMatch(/Cannot reach the server/)
  })
})

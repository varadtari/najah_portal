// Thin wrapper over fetch for the Najah API. Every response uses the backend's shape:
// success is {type:"success", message}, failure is an ApplicationError whose
// message.displayMessage is written for end users.

export const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  readonly code?: number
  readonly requestId?: string

  constructor(status: number, message: string, code?: number, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

type ErrorBody = {
  type?: string
  requestId?: string
  message?: { errorCode?: number; displayMessage?: string }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Please sign in',
  403: 'You do not have access to this',
  404: 'Not found',
  409: 'This was changed by someone else. Refresh and try again.',
  429: 'Too many attempts. Please wait and try again.',
}

// Picks the message to show for a failed request: the server's displayMessage when it gave
// one, otherwise a generic line for the status.
export function errorMessageFor(status: number, body: unknown): string {
  const display = (body as ErrorBody | null)?.message?.displayMessage?.trim()
  if (display) return display
  return FALLBACK_MESSAGES[status] ?? 'Something went wrong. Please try again.'
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function api<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(API_BASE + path, {
      method,
      signal,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(0, 'Cannot reach the server. Check your internet connection.')
  }

  const parsed: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errorBody = parsed as ErrorBody | null
    throw new ApiError(response.status, errorMessageFor(response.status, parsed), errorBody?.message?.errorCode, errorBody?.requestId)
  }

  return (parsed as { message: T }).message
}

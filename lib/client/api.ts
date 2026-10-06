export type ApiFailure = { code: string; message: string; fields?: Record<string, string[]> }

export class ApiClientError extends Error {
  constructor(public readonly failure: ApiFailure, public readonly status: number) {
    super(failure.message)
  }
}

/**
 * All mutations go through `window.fetch`, which the TollAI client wraps for
 * `/api/*` URLs: it attaches the session, waits out dwell, and re-proves once
 * when a session expires. Errors are mapped to the platform's structured body.
 */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiClientError(
      { code: 'NETWORK', message: 'We could not complete this request. Please check your connection and try again.' },
      0,
    )
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const failure: ApiFailure = {
      code: data?.code ?? 'ERROR',
      message: data?.message ?? 'Something went wrong. Please try again.',
      fields: data?.fields,
    }
    throw new ApiClientError(failure, res.status)
  }
  return data as T
}

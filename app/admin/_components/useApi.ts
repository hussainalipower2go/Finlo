'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export const NOT_READY_CODE = 'ADMIN_DB_NOT_READY'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** True when the backend replied 409 ADMIN_DB_NOT_READY (migration not applied). */
  notReady: boolean
  reload: () => Promise<void>
}

/**
 * Small data-fetching hook used by every admin page.
 * All admin endpoints live under /api/admin/* and enforce admin auth + role.
 */
export function useApi<T>(path: string): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const reqId = useRef(0)

  const load = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(path, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (id !== reqId.current) return
      if (res.status === 409 && json.code === NOT_READY_CODE) {
        setNotReady(true)
        setData(null)
      } else if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`)
      } else {
        setData(json as T)
      }
    } catch {
      if (id !== reqId.current) return
      setError('Network error — try again.')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void (async () => await load())()
  }, [load])

  return { data, loading, error, notReady, reload: load }
}

/** Multi-request, no-op body helper (used with useApi-like patterns when needed). */
export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error: string | null; code?: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, error: json.error ?? null, code: json.code }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export async function patchJson(url: string, body: unknown): Promise<{ ok: boolean; error: string | null; code?: string }> {
  try {
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, error: json.error ?? null, code: json.code }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}
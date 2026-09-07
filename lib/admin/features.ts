/**
 * Feature-flag resolution for server routes (service role).
 * Missing tables/columns fail OPEN for front-end-facing features (never break
 * existing app behaviour) but the flags caringly default to "enabled" unless
 * an admin explicitly disabled them. Never throws.
 */
import { adminDb } from './helpers'

const FLAG_CACHE_TTL = 30_000 as const

const cache = new Map<string, { value: boolean; at: number }>()

export async function isFlagEnabled(key: string, defaultValue = true): Promise<boolean> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < FLAG_CACHE_TTL) return hit.value
  try {
    const { data, error } = await adminDb().from('feature_flags').select('enabled').eq('key', key).maybeSingle()
    if (error) return defaultValue
    const value = data ? Boolean(data.enabled) : defaultValue
    cache.set(key, { value, at: Date.now() })
    return value
  } catch {
    return defaultValue
  }
}

export function invalidateFlagCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}
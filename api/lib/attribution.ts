// api/lib/attribution.ts
// Validation for landing attribution: the session_start payload (api/events.ts)
// and journeys.acquisition_src (api/journey.ts). The client sends whatever was
// in the URL. A value that fails is dropped, never cleaned up, so nothing
// half-sanitised ever lands in a row.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

const UTM_RE = /^[a-z0-9._~-]{1,64}$/

// RFC 1123 hostname: dot-separated labels of 1-63 alphanumerics or hyphens,
// no leading or trailing hyphen, 253 chars max.
const HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/

// A URL path as the browser serialises it (percent-encoded), 128 chars max.
const PATH_RE = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]{0,127}$/

/** A utm_* value: trimmed, lowercased, [a-z0-9._~-] only, 64 chars max. Else null. */
export function utmValue(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().toLowerCase()
  return UTM_RE.test(t) ? t : null
}

/**
 * The session_start payload, reduced to the 7 attribution keys. Unknown keys
 * and invalid values are dropped, so `{}` is a valid result.
 */
export function sessionStartPayload(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const v = utmValue(raw[key])
    if (v) out[key] = v
  }
  const host = typeof raw.ref_host === 'string' ? raw.ref_host.trim().toLowerCase() : ''
  if (HOST_RE.test(host)) out.ref_host = host
  const path = typeof raw.landing_path === 'string' ? raw.landing_path.trim() : ''
  if (PATH_RE.test(path)) out.landing_path = path
  return out
}

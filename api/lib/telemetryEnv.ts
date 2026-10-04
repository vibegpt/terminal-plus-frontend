// api/lib/telemetryEnv.ts
// Server-side provenance for telemetry rows (events, journeys, agent_interactions).
// env comes from Vercel, never from the client, so a client can't pass itself off
// as production. is_test is opt-in only: a request can flag its own rows as test
// (Playwright, smoke scripts, the tp_test switch), which can only remove data from
// the production views, never add to them.

import type { IncomingHttpHeaders } from 'http'

/** 'production' | 'preview' | 'development', from VERCEL_ENV. */
export function telemetryEnv(): string {
  return process.env.VERCEL_ENV ?? 'development'
}

/**
 * True when the request carries `x-tp-test: 1` or its JSON body has
 * `test: true`. The body flag exists because sendBeacon can't set headers, and
 * the client's unload flush is a beacon. Older clients send only the header.
 */
export function isTestRequest(headers: IncomingHttpHeaders, body?: unknown): boolean {
  const v = headers['x-tp-test']
  if ((Array.isArray(v) ? v[0] : v) === '1') return true
  return typeof body === 'object' && body !== null && (body as Record<string, unknown>).test === true
}

/** mcp-session-id values our smoke scripts send. MCP has no other test channel. */
export function isTestMcpSession(key: string | null): boolean {
  return !!key && /^(smoke|test)-/i.test(key)
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

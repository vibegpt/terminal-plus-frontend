// api/lib/crawler.ts
// Server-side bot provenance for telemetry rows (events, journeys), alongside env and
// is_test in ./telemetryEnv. Kept in its own file so the isbot list is bundled only
// with the routes that use it, not with chat or MCP.
//
// isbot matches crawlers that identify themselves (Googlebot, Bingbot, headless
// Chrome, curl, ...). It can't catch a bot posing as a browser. A spoofed bot agent
// can only hide its own rows from the analytics views. The agent string is read here
// and never stored or logged.

import type { IncomingHttpHeaders } from 'http'
import { isBot } from 'isbot'

/**
 * True when the request's User-Agent is a known crawler, or missing. Every browser
 * sends one (sendBeacon included), so a request without an agent is a script.
 */
export function isBotRequest(headers: IncomingHttpHeaders): boolean {
  const raw = headers['user-agent']
  const ua = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  if (!ua) return true
  return isBot(ua)
}

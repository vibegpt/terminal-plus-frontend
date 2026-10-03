import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { UUID_RE, isTestRequest, telemetryEnv } from './lib/telemetryEnv'
import { sessionStartPayload } from './lib/attribution'

// ---------- Load .env.local for vercel dev ----------
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let val = trimmed.slice(eqIdx + 1)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* not found in production — fine */ }

// ---------- Supabase (service role only — RLS has no policies on events) ----------

let _supabase: ReturnType<typeof createClient> | null = null
function getServiceClient() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ---------- Validation ----------

const MAX_BATCH = 50
const MAX_PAYLOAD_BYTES = 8192

const EVENT_TYPES = new Set([
  'session_start',
  'vibe_selected',
  'recommendation_impression',
  'amenity_tapped',
  'amenity_detail_dwell',
  'route_started',
  'stop_completed',
  'stop_skipped',
  'search_performed',
  'tool_called',
  'flight_not_found',
  'capture_opened',
])

// Where a flight capture was opened from (src/lib/capture.ts CaptureEntry).
const CAPTURE_ENTRIES = new Set(['gate', 'bar', 'prompt', 'change_flight'])

const SURFACES = new Set(['app', 'chat', 'mcp'])

const TERMINALS = new Set(['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'])

type EventRow = {
  anon_id: string
  session_id: string
  surface: string
  event_type: string
  terminal_code: string | null
  vibe: string | null
  amenity_slug: string | null
  position: number | null
  minutes_to_boarding: number | null
  route_id: string | null
  journey_id: string | null
  payload: Record<string, unknown>
}

// env and is_test are server-side provenance, stamped in the handler.
type StampedEventRow = EventRow & { env: string; is_test: boolean }

// Returns a clean row to insert, or a rejection reason string.
function validateEvent(raw: unknown): { row: EventRow } | { reason: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { reason: 'event must be an object' }
  }
  const e = raw as Record<string, unknown>

  if (typeof e.event_type !== 'string' || !EVENT_TYPES.has(e.event_type)) {
    return { reason: `unknown event_type: ${String(e.event_type).slice(0, 50)}` }
  }
  if (typeof e.surface !== 'string' || !SURFACES.has(e.surface)) {
    return { reason: `invalid surface: ${String(e.surface).slice(0, 50)}` }
  }
  if (typeof e.anon_id !== 'string' || !UUID_RE.test(e.anon_id)) {
    return { reason: 'anon_id must be a UUID' }
  }
  if (typeof e.session_id !== 'string' || !UUID_RE.test(e.session_id)) {
    return { reason: 'session_id must be a UUID' }
  }
  if (e.terminal_code != null && (typeof e.terminal_code !== 'string' || !TERMINALS.has(e.terminal_code))) {
    return { reason: `terminal_code must be a SIN terminal or null: ${String(e.terminal_code).slice(0, 50)}` }
  }
  if (e.route_id != null && (typeof e.route_id !== 'string' || !UUID_RE.test(e.route_id))) {
    return { reason: 'route_id must be a UUID or null' }
  }
  if (e.position != null && (typeof e.position !== 'number' || !Number.isInteger(e.position) || e.position < 0 || e.position > 32767)) {
    return { reason: 'position must be a small non-negative integer or null' }
  }
  if (e.minutes_to_boarding != null && (typeof e.minutes_to_boarding !== 'number' || !Number.isInteger(e.minutes_to_boarding))) {
    return { reason: 'minutes_to_boarding must be an integer or null' }
  }
  if (e.vibe != null && (typeof e.vibe !== 'string' || e.vibe.length > 100)) {
    return { reason: 'vibe must be a short string or null' }
  }
  if (e.amenity_slug != null && (typeof e.amenity_slug !== 'string' || e.amenity_slug.length > 200)) {
    return { reason: 'amenity_slug must be a string or null' }
  }

  let payload: Record<string, unknown> = {}
  if (e.payload != null) {
    if (typeof e.payload !== 'object' || Array.isArray(e.payload)) {
      return { reason: 'payload must be a JSON object' }
    }
    let serialized: string
    try {
      serialized = JSON.stringify(e.payload)
    } catch {
      return { reason: 'payload is not serializable' }
    }
    if (Buffer.byteLength(serialized, 'utf-8') >= MAX_PAYLOAD_BYTES) {
      return { reason: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes` }
    }
    payload = e.payload as Record<string, unknown>
  }

  // session_start carries landing attribution only: the 7 known keys, validated.
  if (e.event_type === 'session_start') payload = sessionStartPayload(payload)
  // capture_opened carries only its entry point, and only a known one.
  if (e.event_type === 'capture_opened') {
    const entry = payload.entry
    payload = typeof entry === 'string' && CAPTURE_ENTRIES.has(entry) ? { entry } : {}
  }

  // occurred_at deliberately omitted — the DB default (now()) is the source
  // of truth in v1; client timestamps are ignored.
  return {
    row: {
      anon_id: e.anon_id,
      session_id: e.session_id,
      surface: e.surface,
      event_type: e.event_type,
      terminal_code: (e.terminal_code as string | undefined) ?? null,
      vibe: (e.vibe as string | undefined) ?? null,
      amenity_slug: (e.amenity_slug as string | undefined) ?? null,
      position: (e.position as number | undefined) ?? null,
      minutes_to_boarding: (e.minutes_to_boarding as number | undefined) ?? null,
      route_id: (e.route_id as string | undefined) ?? null,
      // A malformed journey_id costs the join, not the event.
      journey_id: typeof e.journey_id === 'string' && UUID_RE.test(e.journey_id) ? e.journey_id : null,
      payload,
    },
  }
}

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tp-test')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let events: unknown
  try {
    const body = req.body
    if (typeof body === 'string') {
      events = (JSON.parse(body) as Record<string, unknown>).events
    } else if (typeof body === 'object' && body !== null) {
      events = (body as Record<string, unknown>).events
    }
  } catch {
    return res.status(400).json({ error: 'Malformed JSON body' })
  }

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Body must be { events: [...] } with at least one event' })
  }
  if (events.length > MAX_BATCH) {
    return res.status(400).json({ error: `Batch too large (max ${MAX_BATCH} events)` })
  }

  const env = telemetryEnv()
  const is_test = isTestRequest(req.headers)
  const rows: StampedEventRow[] = []
  const rejected: Array<{ index: number; reason: string }> = []
  events.forEach((raw, index) => {
    const result = validateEvent(raw)
    if ('row' in result) rows.push({ ...result.row, env, is_test })
    else rejected.push({ index, reason: result.reason })
  })

  if (rows.length === 0) {
    return res.status(200).json({ inserted: 0, rejected })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return res.status(500).json({ error: 'Events backend not configured' })
  }

  const { error } = await supabase.from('events').insert(rows)
  if (error) {
    console.error('[events] insert failed:', error.code, error.message)
    return res.status(500).json({ error: 'Failed to persist events' })
  }

  return res.status(200).json({ inserted: rows.length, rejected })
}

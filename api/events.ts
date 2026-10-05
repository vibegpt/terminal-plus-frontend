import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { UUID_RE, isTestRequest, telemetryEnv } from './lib/telemetryEnv'
import { isBotRequest } from './lib/crawler'
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
  // CC-13 journey trail
  'outcome_eligible',
  'outcome_shown',
  'outcome_response',
  'gate_prompt_shown',
  'gate_reached',
])

// Where a flight capture was opened from (src/lib/capture.ts CaptureEntry).
const CAPTURE_ENTRIES = new Set(['gate', 'bar', 'prompt', 'change_flight'])

const SURFACES = new Set(['app', 'chat', 'mcp'])

const TERMINALS = new Set(['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'])

// CC-13 enums (mirror of src/lib/outcomePrompt.ts — keep in sync).
// outcome_self_reported is a claim, not a position fix: these rows say what a person
// answered, never where they were.
const CANDIDATE_TYPES = new Set(['detail_open', 'save', 'directions'])
const OUTCOMES = new Set(['yes', 'no', 'dismissed'])
const OUTCOME_REASONS = new Set(['no_time', 'changed_mind'])
const OUTCOME_SOURCES = new Set(['prompt', 'checkin', 'qr', 'inferred'])
const SPEND_BANDS = new Set(['none', 'lt_10', '10_30', 'gt_30'])
const GATE_RE = /^[A-Z0-9-]{1,8}$/
const MAX_MINUTES = 7 * 24 * 60

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

// env, is_test and is_bot are server-side provenance, stamped in the handler.
type StampedEventRow = EventRow & { env: string; is_test: boolean; is_bot: boolean }

// gap_minutes / candidate_age_minutes: minutes to 1 decimal, 0 to 7 days.
function badMinutes(v: unknown, nullable: boolean): boolean {
  if (v == null) return !nullable
  return typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > MAX_MINUTES
}

function enumOrNull(v: unknown, allowed: Set<string>): boolean {
  return v == null || (typeof v === 'string' && allowed.has(v))
}

// The journey-trail events (CC-13). Unknown enum values are rejected, never stored.
// Returns a rejection reason, or null when the event isn't one of them or is valid.
function validateTrailEvent(e: Record<string, unknown>, p: Record<string, unknown>): string | null {
  const type = e.event_type
  if (type === 'outcome_eligible' || type === 'outcome_shown' || type === 'outcome_response') {
    if (typeof e.amenity_slug !== 'string' || !e.amenity_slug) return `${type} needs amenity_slug`
  }
  switch (type) {
    case 'outcome_eligible':
      if (typeof p.candidate_type !== 'string' || !CANDIDATE_TYPES.has(p.candidate_type)) return 'invalid candidate_type'
      if (badMinutes(p.gap_minutes, false) || badMinutes(p.candidate_age_minutes, false)) return 'invalid gap_minutes or candidate_age_minutes'
      return null
    case 'outcome_shown':
      if (badMinutes(p.gap_minutes, false) || badMinutes(p.candidate_age_minutes, false)) return 'invalid gap_minutes or candidate_age_minutes'
      return null
    case 'outcome_response': {
      if (typeof p.outcome !== 'string' || !OUTCOMES.has(p.outcome)) return 'invalid outcome'
      if (typeof p.outcome_source !== 'string' || !OUTCOME_SOURCES.has(p.outcome_source)) return 'invalid outcome_source'
      if (!enumOrNull(p.outcome_reason, OUTCOME_REASONS)) return 'invalid outcome_reason'
      if (p.outcome_reason != null && p.outcome !== 'no') return 'outcome_reason is only valid with outcome no'
      if (!enumOrNull(p.spend_band, SPEND_BANDS)) return 'invalid spend_band'
      if (p.spend_band != null && p.outcome !== 'yes') return 'spend_band is only valid with outcome yes'
      // A strip answer always has a measured gap; a check-in on the detail page may not.
      const nullable = p.outcome_source !== 'prompt'
      if (badMinutes(p.gap_minutes, nullable) || badMinutes(p.candidate_age_minutes, nullable)) return 'invalid gap_minutes or candidate_age_minutes'
      return null
    }
    case 'gate_prompt_shown':
    case 'gate_reached':
      if (typeof p.gate !== 'string' || !GATE_RE.test(p.gate)) return 'invalid gate'
      if (e.terminal_code == null) return `${type} needs terminal_code`
      if (e.minutes_to_boarding == null) return `${type} needs minutes_to_boarding`
      return null
    default:
      return null
  }
}

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

  const trailError = validateTrailEvent(e, payload)
  if (trailError) return { reason: trailError }

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

  // Parsed once: it holds the events and, from the tp_test switch, `test: true`.
  let parsed: Record<string, unknown> | null = null
  try {
    const body = req.body
    if (typeof body === 'string') {
      parsed = JSON.parse(body) as Record<string, unknown>
    } else if (typeof body === 'object' && body !== null) {
      parsed = body as Record<string, unknown>
    }
  } catch {
    return res.status(400).json({ error: 'Malformed JSON body' })
  }
  const events = parsed?.events

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Body must be { events: [...] } with at least one event' })
  }
  if (events.length > MAX_BATCH) {
    return res.status(400).json({ error: `Batch too large (max ${MAX_BATCH} events)` })
  }

  const env = telemetryEnv()
  const is_test = isTestRequest(req.headers, parsed)
  const is_bot = isBotRequest(req.headers)
  const rows: StampedEventRow[] = []
  const rejected: Array<{ index: number; reason: string }> = []
  events.forEach((raw, index) => {
    const result = validateEvent(raw)
    if ('row' in result) rows.push({ ...result.row, env, is_test, is_bot })
    else rejected.push({ index, reason: result.reason })
  })

  // Rejection is per row: a 400 on a mixed batch would make the client re-queue
  // and re-send its valid rows. A batch with nothing valid in it is a 400.
  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid events', inserted: 0, rejected })
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

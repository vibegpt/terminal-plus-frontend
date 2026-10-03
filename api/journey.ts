import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { UUID_RE, isTestRequest, telemetryEnv } from './lib/telemetryEnv'
import { utmValue } from './lib/attribution'

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

// ---------- Supabase (service role — journeys writes go server-side, like events) ----------

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

// Mirrors the journeys_flight_source_chk / journeys_inbound_flight_source_chk
// CHECK constraints. Keep in sync with the migration.
const FLIGHT_SOURCES = new Set([
  'scanned',
  'picker',
  'picker_ungrouped',
  'typed',
  'inferred',
  'skipped',
])

const JOURNEY_TYPES = new Set(['departing', 'connecting', 'just_landed', 'skipped'])

interface JourneyRow {
  session_id: string | null
  anon_id: string | null
  journey_type: string | null
  flight_number: string | null
  destination: string | null
  departure_time: string | null
  flight_source: string | null
  inbound_flight: string | null
  inbound_origin: string | null
  inbound_flight_source: string | null
  inbound_arrival_utc: string | null
  connection_minutes: number | null
  onboarding_skipped: boolean
  onboarding_completed_at: string | null
  first_open_country: string | null
  acquisition_src: string | null
  device_locale: string | null
  device_timezone: string | null
}

/** Trimmed string capped at `max`, or null. Never free-form-long. */
function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.length > max) return null
  return t
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // AeroDataBox times look like "2026-10-02 15:20Z"; only the "T" form is guaranteed to parse.
  const d = new Date(v.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * journeys.anon_id / session_id become uuid columns (CC-7). A non-UUID value
 * would fail the whole insert and lose the journey, so it's dropped to null.
 */
function uuidOrNull(v: unknown): string | null {
  return typeof v === 'string' && UUID_RE.test(v.trim()) ? v.trim() : null
}

/** Onward departure minus inbound arrival, kept only when it's a plausible same-day connection. */
function connectionMinutes(departureIso: string | null, arrivalIso: string | null): number | null {
  if (!departureIso || !arrivalIso) return null
  const mins = Math.round((Date.parse(departureIso) - Date.parse(arrivalIso)) / 60000)
  return Number.isFinite(mins) && mins >= 0 && mins <= 1440 ? mins : null
}

function validate(raw: unknown, country: string | null): { row: JourneyRow } | { reason: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { reason: 'journey must be an object' }
  }
  const j = raw as Record<string, unknown>

  const flightSource = str(j.flight_source, 20)
  if (!flightSource || !FLIGHT_SOURCES.has(flightSource)) {
    return { reason: `invalid flight_source: ${String(j.flight_source).slice(0, 50)}` }
  }

  const inboundSource = str(j.inbound_flight_source, 20)
  if (inboundSource !== null && !FLIGHT_SOURCES.has(inboundSource)) {
    return { reason: `invalid inbound_flight_source: ${inboundSource.slice(0, 50)}` }
  }

  const journeyType = str(j.journey_type, 20)
  if (journeyType !== null && !JOURNEY_TYPES.has(journeyType)) {
    return { reason: `invalid journey_type: ${journeyType.slice(0, 50)}` }
  }

  const departureTime = isoOrNull(j.departure_time)
  const inboundArrival = isoOrNull(j.inbound_arrival_utc)

  return {
    row: {
      session_id: uuidOrNull(j.session_id),
      anon_id: uuidOrNull(j.anon_id),
      journey_type: journeyType,
      flight_number: str(j.flight_number, 10),
      destination: str(j.destination, 4),
      departure_time: departureTime,
      flight_source: flightSource,
      inbound_flight: str(j.inbound_flight, 10),
      inbound_origin: str(j.inbound_origin, 4),
      inbound_flight_source: inboundSource,
      inbound_arrival_utc: inboundArrival,
      connection_minutes: connectionMinutes(departureTime, inboundArrival),
      onboarding_skipped: j.onboarding_skipped === true,
      onboarding_completed_at: isoOrNull(j.onboarding_completed_at) ?? new Date().toISOString(),
      // Server-side only: the client cannot spoof its own country.
      first_open_country: country,
      // The browser's first-touch source (src/lib/telemetry.ts firstTouchSource),
      // held to the utm_source rule. Null when absent or malformed.
      acquisition_src: utmValue(j.acquisition_src),
      device_locale: str(j.device_locale, 20),
      device_timezone: str(j.device_timezone, 64),
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

  let journey: unknown
  try {
    const body = req.body
    if (typeof body === 'string') {
      journey = (JSON.parse(body) as Record<string, unknown>).journey
    } else if (typeof body === 'object' && body !== null) {
      journey = (body as Record<string, unknown>).journey
    }
  } catch {
    return res.status(400).json({ error: 'Malformed JSON body' })
  }

  if (!journey) {
    return res.status(400).json({ error: 'Body must be { journey: {...} }' })
  }

  const rawCountry = req.headers['x-vercel-ip-country']
  const country = typeof rawCountry === 'string' ? rawCountry.slice(0, 2).toUpperCase() : null

  const result = validate(journey, country)
  if ('reason' in result) {
    return res.status(400).json({ error: result.reason })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return res.status(500).json({ error: 'Journey backend not configured' })
  }

  // Cast at the boundary: the client is untyped (no generated DB types), so its
  // insert() overloads want a bare Record. JourneyRow is the real contract.
  const row = { ...result.row, env: telemetryEnv(), is_test: isTestRequest(req.headers) }
  const { data, error } = await supabase
    .from('journeys')
    .insert(row as unknown as Record<string, unknown>)
    .select('id')
    .single()

  if (error) {
    console.error('[journey] insert failed:', error.code, error.message)
    return res.status(500).json({ error: 'Failed to persist journey' })
  }

  return res.status(200).json({ id: (data as { id: string }).id })
}

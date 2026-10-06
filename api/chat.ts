import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { queryRouteMatch } from './lib/agent'
import type { RouteMatch } from './lib/agent'
import { logChatTurn } from './lib/agentTelemetry'
import type { ChatTurnLog } from './lib/agentTelemetry'
import { formatAmenityBlock, mentionedPlace, parseReply, placeCode, replyText, statedLocation } from './lib/chatPayload'
import type { PlaceCode } from './lib/chatPayload'
import type { ChatReply } from './lib/chatPayload'
import { CHAT_MODEL, FALLBACK_MODEL, chatParams } from './lib/models'
import { UUID_RE, isTestRequest, telemetryEnv } from './lib/telemetryEnv'
import { DISPLAY } from '../src/lib/displayConfig'
import { sgMinutesOfDay } from '../src/lib/sgTime'
import { LANDSIDE_MIN_MINUTES, eligibility, pickEligible, type EligibilityContext } from '../shared/ranking/policy'

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

// ---------- Lazy clients ----------

let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY')
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    if (!url && key) {
      try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
        if (payload.ref) url = `https://${payload.ref}.supabase.co`
      } catch { /* ignore */ }
    }
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ---------- Types ----------

interface ChatContext {
  terminal?: string
  /** Passenger type from the capture. Client-supplied: checked against JOURNEY_TYPES. */
  journeyType?: string
  isTransit?: boolean
  departureTime?: string
  availableMinutes?: number
  gate?: string
  /** The flight the user entered in the app (client-supplied: validated before use) */
  flight?: {
    number?: string
    destination?: string | null
    departureTerminal?: string
    boardingTime?: string   // ISO 8601
  }
}

// journeys.journey_type values the chat acts on; 'skipped' means unknown.
const JOURNEY_TYPES = new Set(['departing', 'connecting', 'just_landed'])

interface ChatRequestBody {
  query: string
  context?: ChatContext
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Telemetry ids, the same values the client's events carry. UUID-checked. */
  session_id?: string
  journey_id?: string
}

interface PreFilterResult {
  /** Where the user is: the stored journey or an explicit "I'm at / I'm in". Never a mere mention. */
  userLocation: PlaceCode | null
  /** A place they asked about that isn't where they are ("Can I go to Jewel?"). */
  askedAbout: PlaceCode | null
  /** Terminals the amenity search covers: the place asked about, then where they are. */
  scope: PlaceCode[]
  keywords: string[]
  wantsOpenNow: boolean
  isTransit: boolean
  gate?: string
  availableMinutes?: number
}

// ---------- Venue config (swappable per airport) ----------

interface VenueConfig {
  airportCode: string
  bufferMinutes: number
  minDwellByCategory: Record<string, number>
  peakHours: Array<{ start: number; end: number; label: string }>
  timezone: string
}

const CHANGI_CONFIG: VenueConfig = {
  airportCode: 'SIN',
  bufferMinutes: 15,
  minDwellByCategory: {
    coffee: 5,
    cafe: 5,
    bar: 10,
    restaurant: 20,
    dining: 20,
    lounge: 30,
    spa: 25,
    massage: 25,
    shop: 10,
    retail: 10,
    attraction: 15,
    garden: 10,
    default: 10,
  },
  peakHours: [
    { start: 700, end: 900, label: 'morning rush' },
    { start: 1130, end: 1330, label: 'peak lunch' },
    { start: 1830, end: 2030, label: 'peak dinner' },
  ],
  timezone: 'Asia/Singapore',
}

// ---------- Time helpers ----------

function getCurrentMinutes(timezone: string): number {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const [h, m] = timeStr.split(':').map(Number)
  return h * 100 + m
}

function getPeakLabel(config: VenueConfig): string | null {
  const current = getCurrentMinutes(config.timezone)
  for (const peak of config.peakHours) {
    if (current >= peak.start && current <= peak.end) return peak.label
  }
  return null
}

function getMinDwell(amenity: any, config: VenueConfig): number {
  const tags = (amenity.vibe_tags || '').toLowerCase()
  const name = (amenity.name || '').toLowerCase()
  for (const [cat, mins] of Object.entries(config.minDwellByCategory)) {
    if (tags.includes(cat) || name.includes(cat)) return mins
  }
  return config.minDwellByCategory.default
}

function getWalkMinutes(amenity: any, gate?: string): number {
  if (amenity.walking_time_minutes) return amenity.walking_time_minutes
  if (amenity.gate_location && gate) {
    const amenityZone = amenity.gate_location.charAt(0).toUpperCase()
    const userZone = gate.charAt(0).toUpperCase()
    return amenityZone === userZone ? 3 : 6
  }
  return 5
}

// ---------- Smart 7 filter ----------
// Uses MINIMUM dwell time as a hard floor only.
// Does not pretend to know actual duration — that's Claude's job.
// Where a venue is (landside or not) is the eligibility policy's call, not a walk limit.

function applySmart7(
  amenities: any[],
  availableMinutes: number | null,
  gate: string | undefined,
  config: VenueConfig,
): any[] {
  if (availableMinutes === null) return amenities

  const usable = availableMinutes - config.bufferMinutes
  if (usable <= 0) return []

  return amenities.filter(a => {
    const walkTo = getWalkMinutes(a, gate)
    const minDwell = getMinDwell(a, config)
    const walkBack = walkTo
    return (walkTo + minDwell + walkBack) <= usable
  })
}

// Test requests outside production may set the Singapore clock: x-tp-now: HH:MM.
function parseTestClock(v: string | string[] | undefined): number | null {
  const m = (Array.isArray(v) ? v[0] : v)?.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// ---------- Extract departure time from conversation ----------

function extractAvailableMinutes(
  query: string,
  history: Array<{ role: string; content: string }>,
  existingMinutes?: number,
): number | null {
  if (existingMinutes) return existingMinutes

  const allText = [query, ...history.slice(-6).map(h => h.content)].join(' ').toLowerCase()

  // "2 hours", "1.5 hours", "half an hour"
  const hoursMatch = allText.match(/(\d+(?:\.\d+)?)\s*hours?/)
  if (hoursMatch) return Math.round(parseFloat(hoursMatch[1]) * 60)

  if (/half\s+an?\s+hour/.test(allText)) return 30

  // "45 minutes", "90 min"
  const minsMatch = allText.match(/(\d+)\s*min(?:utes?)?/)
  if (minsMatch) {
    const val = parseInt(minsMatch[1])
    if (val > 0 && val < 600) return val
  }

  // "flight at 3pm", "boarding at 14:30", "departs at 2:45"
  const timeMatch = allText.match(
    /(?:flight|boarding|gate closes?|departs?|leaves?|taking off)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  )
  if (timeMatch) {
    let hours = parseInt(timeMatch[1])
    const mins = parseInt(timeMatch[2] || '0')
    const ampm = timeMatch[3]?.toLowerCase()
    if (ampm === 'pm' && hours < 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0

    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: CHANGI_CONFIG.timezone })
    )
    const departure = new Date(now)
    departure.setHours(hours, mins, 0, 0)
    if (departure <= now) departure.setDate(departure.getDate() + 1)

    const diff = Math.round((departure.getTime() - now.getTime()) / 60000)
    return diff > 0 && diff < 600 ? diff : null
  }

  return null
}

// ---------- Flight the user entered in the app ----------

// One line for the prompt, e.g. "User's flight: QF1 to LHR, departing SIN-T1, boarding 22:45 SGT."
// Every field is client-supplied, so each is checked against a strict pattern first.
function describeFlight(flight: ChatContext['flight']): string {
  if (!flight || typeof flight.number !== 'string' || !/^[A-Z0-9]{2,8}$/i.test(flight.number)) return ''
  const destination =
    typeof flight.destination === 'string' && /^[A-Z]{3}$/i.test(flight.destination)
      ? flight.destination.toUpperCase()
      : null
  const terminal =
    typeof flight.departureTerminal === 'string' && /^SIN-(T[1-4]|JEWEL)$/.test(flight.departureTerminal)
      ? flight.departureTerminal
      : null
  const boardingMs = typeof flight.boardingTime === 'string' ? Date.parse(flight.boardingTime) : NaN
  const boards = Number.isNaN(boardingMs)
    ? null
    : new Date(boardingMs).toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false,
      })
  return [
    `User's flight: ${flight.number.toUpperCase()}`,
    destination ? ` to ${destination}` : '',
    terminal ? `, departing ${terminal}` : '',
    boards ? `, boarding ${boards} SGT` : '',
    '.',
  ].join('')
}

// ---------- Pre-filter ----------

const STOP_WORDS = new Set([
  'find', 'me', 'a', 'an', 'the', 'in', 'at', 'near', 'around', 'can', 'i',
  'get', 'some', 'any', 'where', 'is', 'are', 'there', 'what', 'which',
  'show', 'suggest', 'recommend', 'want', 'need', 'looking', 'for', 'to',
  'please', 'do', 'does', 'from', 'with', 'and', 'or', 'my', 'gate',
  'terminal', 'now', 'open', 'currently', 'best', 'good', 'great', 'nice',
  'have', 'has', 'like', 'love', 'really', 'very', 'just', 'also', 'but',
  'not', 'that', 'this', 'its', 'how', 'about', 'close',
])

function preFilter(
  query: string,
  context: ChatContext | undefined,
  history: Array<{ role: string; content: string }>,
): PreFilterResult {
  const q = query.toLowerCase()

  // Location: an explicit statement in this message (newest), then the stored
  // journey, then the latest explicit statement earlier in the chat.
  const earlier = history
    .filter(h => h.role === 'user')
    .map(h => statedLocation(h.content))
    .reverse()
    .find((p): p is PlaceCode => p !== null) ?? null
  const userLocation = statedLocation(query) ?? placeCode(context?.terminal) ?? earlier
  const mentioned = mentionedPlace(query)
  const askedAbout = mentioned && mentioned !== userLocation ? mentioned : null
  const scope = [askedAbout, userLocation].filter((p): p is PlaceCode => p !== null)

  const gateMatch = q.match(/\b(?:gate\s*)?([a-f]\d{1,3})\b/i)
  const gate = gateMatch?.[1]?.toUpperCase() ?? context?.gate

  const isTransit =
    context?.isTransit ||
    /\b(transit|in transit|transfer|layover|stopover|connecting)\b/i.test(q)

  const wantsOpenNow =
    /\b(open now|what'?s open|currently open|open right now)\b/i.test(q)

  const keywords = q
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .filter(w => !/^t[1-4]$/.test(w) && w !== 'jewel')

  return { userLocation, askedAbout, scope, keywords, wantsOpenNow, isTransit, gate }
}

// ---------- Supabase query ----------

async function queryAmenities(filters: PreFilterResult) {
  let query = getSupabase()
    .from('amenity_detail')
    .select('*')
    .eq('airport_code', 'SIN')
    .order('editorial_score', { ascending: false, nullsFirst: false })

  if (filters.scope.length) query = query.in('terminal_code', filters.scope)
  // In transit used to mean available_in_tr = true. Every row that isn't is
  // landside (CC-17), so the landside rule in the handler decides instead.

  if (filters.keywords.length > 0) {
    const orParts = filters.keywords.flatMap(kw => {
      const safe = kw.replace(/[^a-z0-9]/g, '')
      return [
        `name.ilike.%${safe}%`,
        `description.ilike.%${safe}%`,
        `vibe_tags.ilike.%${safe}%`,
      ]
    })
    query = query.or(orParts.join(','))
  }

  const { data, error } = await query.limit(DISPLAY.SEARCH_LIMIT)
  if (error) throw error

  if ((!data || data.length < 3) && filters.keywords.length > 0) {
    let broad = getSupabase().from('amenity_detail').select('*').eq('airport_code', 'SIN')
    if (filters.scope.length) broad = broad.in('terminal_code', filters.scope)
    broad = broad.order('editorial_score', { ascending: false, nullsFirst: false })
    const { data: broadData } = await broad.limit(DISPLAY.SEARCH_LIMIT)
    return broadData || []
  }

  return data || []
}

// ---------- System prompt ----------

// Stable first: rules, then context that never changes. Everything per-turn goes
// in the last user message, so a cache breakpoint can sit at the end of this later.
const SYSTEM_PROMPT = `You are the Terminal+ concierge for Singapore Changi Airport (SIN).

Response rules:
1. Be conversational and warm — 2–3 sentences for the message.
2. ALWAYS respond with valid JSON (no markdown fences):
{"message":"your response","recommended_slugs":["slug1","slug2"],"follow_up":"question or null","extracted_context":{"terminal":"SIN-T2","available_minutes":90,"gate":"B12"}}
3. recommended_slugs MUST only contain slug values from the provided amenity list.
4. Recommend 3–5 amenities ranked by relevance.
5. extracted_context: include ONLY fields you can confidently extract from the conversation. Omit fields you cannot determine. Use null for extracted_context if nothing new was found.
6. When you have time context: be honest about uncertainty. Say "this could take 20–40 min depending on queues" rather than stating a fixed duration. Flag tight connections clearly.
7. If no amenities match, say so and suggest what the user could try instead.
8. If you don't know the user's departure time, ask naturally as a follow-up question.
9. Each turn gives "User location". Never place the user somewhere they only mention or ask about: "Can I go to Jewel?" doesn't mean they're at Jewel. If their location is unknown, don't say where they are.

Amenity list:
Each turn lists the amenities you may recommend as rows of "|"-separated fields under a header row (empty = unknown). hours is opening hours, price the price level, vibes the amenity's tags; description is given only when there's no editorial_note. Every venue listed is open now, unless access says "Opens HH:MM" (closed, opens soon: say when) or its hours can't be read. access also carries a landside venue's label ("Before immigration", or that it's landside): mention it when you recommend that venue.

Editorial notes:
Some amenities have an editorial_note — a concierge-style recommendation from real traveller opinions. When present, weave the insight naturally into your response (don't copy-paste). Use route_context to explain who it's best for. Prefer higher editorial_score amenities when all else is equal. Use specific details (dish names, tips) from editorial notes to make recommendations concrete.
IMPORTANT: Editorial notes are based on traveller reviews that may be outdated. Never quote specific prices. If asked about prices, say "prices may have changed — check at the venue or on the Changi Airport website." Use general terms like "budget-friendly", "mid-range", or "premium" based on the price field.

Jewel (SIN-JEWEL) and other landside venues:
Jewel, arrival halls and shops before security are landside, outside immigration. Whether they fit depends on the passenger type and minutes to boarding, both given each turn; the amenity list already leaves out landside venues the rule excludes. The rule:
- connecting: only with ${LANDSIDE_MIN_MINUTES.connecting}+ minutes to boarding (they clear immigration out and back).
- departing: only with ${LANDSIDE_MIN_MINUTES.departing}+ minutes to boarding, and only before they clear immigration: label every landside pick "before immigration" in your message.
- just landed: always.
- type unknown: with minutes to boarding known, treat as connecting; with no minutes, landside venues are fine, but say they're landside, outside immigration.
When the rule excludes Jewel, leave Jewel amenities out of recommended_slugs, even when asked; say why in one line and suggest something airside.

Key knowledge:
- Changi has 4 terminals (T1–T4) and Jewel (nature-themed mall, landside).
- Skytrain connects T1–T2–T3 airside. T4 is a separate bus ride (~10 min).
- Terminal codes: SIN-T1, SIN-T2, SIN-T3, SIN-T4, SIN-JEWEL.
- Singapore timezone: SGT (UTC+8).`

// ---------- Route context builder ----------

function buildRouteContext(route: RouteMatch, availableMinutes: number): string {
  const lines: string[] = [
    '',
    '[CURATED ROUTE AVAILABLE]',
    `Template: "${route.templateName}" (${route.arrivalTerminal}→${route.departureTerminal}, ${availableMinutes} min)`,
    'This passenger matches a curated transit route. Present these stops as a numbered walking sequence.',
    `Time budget: ${availableMinutes} minutes total, ${availableMinutes - route.gateBufferMinutes} min usable (${route.gateBufferMinutes} min gate buffer)`,
    route.isTimeTight ? 'Note: Time is tight — optional stops have been removed.' : '',
    '',
  ]
  for (const stop of route.stops) {
    const optional = stop.isOptional ? ' [OPTIONAL]' : ''
    lines.push(`Stop ${stop.order}: ${stop.name} (${stop.terminalCode}) — ${stop.durationMinutes} min — ${stop.stopType}${optional}`)
    if (stop.editorialNote) {
      lines.push(`  Editorial: ${stop.editorialNote}`)
    }
  }
  lines.push('')
  lines.push('INSTRUCTIONS: Use this curated route as the backbone of your response. Present stops as a numbered sequence with timing. Use editorial notes for personality — rephrase in your own voice, don\'t copy verbatim. Mention the gate buffer at the end. If optional stops were stripped, don\'t mention them. If the user asks about something not on the route, answer from the amenity list below.')
  lines.push('')
  return lines.filter(Boolean).join('\n')
}

// ---------- Model call ----------

// The whole model budget, primary plus fallback, from the first call.
const CHAT_BUDGET_MS = 15_000
// A primary that hasn't started its reply by now is treated as stalled. One that
// is streaming keeps the whole budget: a fixed cutoff killed healthy turns that
// took 10–12 s (CC-6 baseline, 3 of 20).
const FIRST_OUTPUT_MS = 6_000
// A fallback with less time than this can't finish a reply, so it isn't tried.
const MIN_FALLBACK_MS = 3_000
// Thinking counts toward max_tokens (adaptive by default on the current chat model).
const MAX_TOKENS = 2048

type FallbackReason = 'overloaded' | 'stalled' | 'model_not_found'

class StalledError extends Error {}

function fallbackReason(err: unknown, model: string): FallbackReason | null {
  if (err instanceof StalledError || err instanceof Anthropic.APIConnectionTimeoutError) return 'stalled'
  if (err instanceof Anthropic.NotFoundError && err.message.includes(model)) return 'model_not_found'
  if (err instanceof Anthropic.APIError) {
    const type = (err.error as { error?: { type?: string } } | undefined)?.error?.type
    if (err.status === 529 || type === 'overloaded_error') return 'overloaded'
  }
  return null
}

/**
 * One streamed call, aborted at the deadline. With `firstOutputMs`, it's also
 * aborted (as StalledError) if no content block has started by then.
 */
async function streamReply(
  model: string,
  system: string,
  messages: Anthropic.MessageParam[],
  deadline: number,
  firstOutputMs?: number,
): Promise<Anthropic.Message> {
  const controller = new AbortController()
  let stalled = false
  const budgetTimer = setTimeout(() => controller.abort(), Math.max(0, deadline - Date.now()))
  const stallTimer = firstOutputMs
    ? setTimeout(() => { stalled = true; controller.abort() }, firstOutputMs)
    : undefined
  try {
    const stream = getAnthropic().messages.stream(
      { model, max_tokens: MAX_TOKENS, system, messages, ...chatParams(model) },
      { signal: controller.signal, maxRetries: 0 },
    )
    stream.on('streamEvent', event => {
      if (event.type === 'content_block_start') clearTimeout(stallTimer)
    })
    return await stream.finalMessage()
  } catch (err) {
    if (stalled) throw new StalledError(`${model}: no output after ${firstOutputMs} ms`)
    throw err
  } finally {
    clearTimeout(budgetTimer)
    clearTimeout(stallTimer)
  }
}

/**
 * CHAT_MODEL, then 1 retry on FALLBACK_MODEL when the primary is overloaded,
 * stalls before its first output, or doesn't exist. No SDK-level retries:
 * they'd spend the budget on the model that just failed.
 */
async function callChatModel(
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<{ response: Anthropic.Message; fallbackFrom: string | null }> {
  const deadline = Date.now() + CHAT_BUDGET_MS
  try {
    return { response: await streamReply(CHAT_MODEL, system, messages, deadline, FIRST_OUTPUT_MS), fallbackFrom: null }
  } catch (err) {
    const reason = fallbackReason(err, CHAT_MODEL)
    const remaining = deadline - Date.now()
    if (!reason || CHAT_MODEL === FALLBACK_MODEL || remaining < MIN_FALLBACK_MS) throw err
    console.warn(`[chat] ${CHAT_MODEL}: ${reason}; retrying on ${FALLBACK_MODEL} (${remaining} ms left)`)
    return { response: await streamReply(FALLBACK_MODEL, system, messages, deadline), fallbackFrom: CHAT_MODEL }
  }
}

const REFUSAL_REPLY: ChatReply = {
  message: "I can only help with getting around Changi: food, lounges, shops and how to spend your time before boarding. What are you after?",
  recommended_slugs: [],
  follow_up: null,
  extracted_context: null,
}

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tp-test, x-tp-now')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const startedAt = Date.now()
  const isTest = isTestRequest(req.headers)
  // Set once the request is a valid turn; every valid turn is logged, failed or not.
  let turn: Omit<ChatTurnLog, 'agentResponse' | 'resultSlugs' | 'model' | 'inputTokens' | 'outputTokens' | 'latencyMs'> | null = null

  try {
    const { query, context, conversationHistory, session_id, journey_id } = req.body as ChatRequestBody

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' })
    }
    if (query.length > 500) {
      return res.status(400).json({ error: 'Query too long (max 500 characters)' })
    }

    turn = {
      sessionId: typeof session_id === 'string' && UUID_RE.test(session_id) ? session_id : randomUUID(),
      journeyId: typeof journey_id === 'string' && UUID_RE.test(journey_id) ? journey_id : null,
      userMessage: query,
      terminal: null,
      gate: null,
      timeUntilBoarding: null,
      isTest,
    }

    const history = (conversationHistory || []).slice(-10)

    // Extract available minutes from conversation or use from context
    const availableMinutes = extractAvailableMinutes(query, history, context?.availableMinutes)
    const peakLabel = getPeakLabel(CHANGI_CONFIG)

    // Pre-filter and query
    const filters = preFilter(query, context, history)
    turn.terminal = filters.scope[0] ?? null
    turn.gate = filters.gate ?? null
    turn.timeUntilBoarding = availableMinutes

    const journeyType = typeof context?.journeyType === 'string' && JOURNEY_TYPES.has(context.journeyType)
      ? context.journeyType
      : null
    // Landside and open-now rules (shared/ranking/policy.ts). "I'm in transit"
    // with no passenger type from the capture counts as connecting.
    const testClock = isTest && telemetryEnv() !== 'production' ? parseTestClock(req.headers['x-tp-now']) : null
    const eligibilityCtx: EligibilityContext = {
      journeyType: journeyType ?? (filters.isTransit ? 'connecting' : null),
      minutesToBoarding: availableMinutes,
      nowSgt: testClock ?? sgMinutesOfDay(),
    }

    // Check for curated route match
    const routeMatch = await queryRouteMatch(
      getSupabase(),
      filters.userLocation ?? filters.askedAbout,
      availableMinutes,
      { journeyType: eligibilityCtx.journeyType },
    )

    const allAmenities = await queryAmenities(filters)

    // Smart 7 — hard floor filter only
    const dwellFeasible = applySmart7(
      allAmenities,
      availableMinutes,
      filters.gate ?? context?.gate,
      CHANGI_CONFIG,
    )

    // Then the eligibility rules: open venues and unreadable hours in editorial
    // order; venues opening within the hour only when those can't fill a list.
    const ready = dwellFeasible.filter(a => {
      const tier = eligibility(a, eligibilityCtx).tier
      return tier === 'open' || tier === 'unknown'
    }).length
    const feasibleAmenities = pickEligible(
      dwellFeasible,
      eligibilityCtx,
      Math.max(ready, DISPLAY.COLLECTION_VISIBLE),
      rows => rows,
      a => String(a.amenity_slug),
    )

    // Build context string for Claude
    const currentSGT = new Date().toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const currentClock = testClock !== null
      ? `${String(Math.floor(testClock / 60)).padStart(2, '0')}:${String(testClock % 60).padStart(2, '0')} (test clock)`
      : currentSGT

    const timeContext = availableMinutes !== null
      ? [
          `Minutes to boarding: ${availableMinutes} (${availableMinutes - CHANGI_CONFIG.bufferMinutes} usable after a ${CHANGI_CONFIG.bufferMinutes} min gate buffer).`,
          peakLabel ? `Current period: ${peakLabel} — expect longer waits at food venues.` : '',
          `Amenities shown are pre-filtered to those physically feasible in the time available (${feasibleAmenities.length} of ${allAmenities.length} passed).`,
        ].filter(Boolean).join(' ')
      : `Minutes to boarding: unknown — show all available options. Consider asking the user when their flight is.`
    // Per-turn context, most stable first: the amenity list, then the trip, then the clock.
    const amenityBlock = formatAmenityBlock(feasibleAmenities)
    const userMessage = [
      `Amenities (${feasibleAmenities.length}):${amenityBlock ? `\n${amenityBlock}` : ' none'}`,
      routeMatch && availableMinutes ? buildRouteContext(routeMatch, availableMinutes) : '',
      `User location: ${filters.userLocation ?? "unknown (don't assume one)"}`,
      filters.askedAbout ? `Asked about: ${filters.askedAbout}` : '',
      `Passenger type: ${journeyType ? journeyType.replace('_', ' ') : 'unknown'}`,
      filters.isTransit ? 'User is in transit.' : '',
      filters.gate ? `User gate: ${filters.gate}` : '',
      describeFlight(context?.flight),
      timeContext,
      `Current Singapore time: ${currentClock}`,
      `\nUser: ${query}`,
    ].filter(Boolean).join('\n')

    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userMessage },
    ]

    const { response, fallbackFrom } = await callChatModel(SYSTEM_PROMPT, messages)

    // A refusal is a normal 200 with stop_reason 'refusal'; its content isn't a reply.
    const { reply: parsed, jsonValid } = response.stop_reason === 'refusal'
      ? { reply: REFUSAL_REPLY, jsonValid: false }
      : parseReply(replyText(response.content))

    const recommendedAmenities = parsed.recommended_slugs
      .map((slug: string) => feasibleAmenities.find(a => a.amenity_slug === slug))
      .filter(Boolean)

    // Merge extracted context — only update fields Claude found with confidence
    const extractedContext: Partial<ChatContext> = {}
    const modelContext = parsed.extracted_context as Partial<ChatContext> | null
    if (modelContext) {
      if (modelContext.availableMinutes) extractedContext.availableMinutes = modelContext.availableMinutes
      if (modelContext.gate) extractedContext.gate = modelContext.gate
    }
    // The client keeps this as the user's location, so it's only ever what they
    // said ("I'm at T2"), never the model's reading of a place they mentioned.
    const stated = statedLocation(query)
    if (stated) extractedContext.terminal = stated
    // Also surface what our own extractor found
    if (availableMinutes && !context?.availableMinutes) {
      extractedContext.availableMinutes = availableMinutes
    }

    const shownSlugs = recommendedAmenities.map(a => a.amenity_slug as string)
    logTurn({
      ...turn,
      agentResponse: parsed.message,
      resultSlugs: shownSlugs,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - startedAt,
    })

    return res.status(200).json({
      message: parsed.message,
      amenities: recommendedAmenities,
      followUp: parsed.follow_up || null,
      context: {
        terminal: filters.userLocation ?? undefined,
        isTransit: filters.isTransit,
        totalResults: allAmenities.length,
      },
      extractedContext: Object.keys(extractedContext).length > 0 ? extractedContext : null,
      // Test requests only (x-tp-test: 1): what the model chose before the
      // feasibility filter, for tests/chat-eval. Catalogue slugs and the model name.
      ...(isTest
        ? {
            debug: {
              model: response.model,
              fallback_from: fallbackFrom,
              stop_reason: response.stop_reason,
              json_valid: jsonValid,
              raw_slugs: parsed.recommended_slugs,
              feasible_slugs: feasibleAmenities.map(a => a.amenity_slug),
              available_minutes: availableMinutes,
              journey_type: eligibilityCtx.journeyType,
              now_sgt: eligibilityCtx.nowSgt,
              landside_hidden: dwellFeasible.filter(a => !eligibility(a, eligibilityCtx).access.show).map(a => a.amenity_slug),
              closed_hidden: dwellFeasible.filter(a => {
                const e = eligibility(a, eligibilityCtx)
                return e.access.show && !e.tier
              }).length,
              route_stops: routeMatch?.stops.map(s => s.amenitySlug).filter(Boolean) ?? null,
            },
          }
        : {}),
    })

  } catch (error: unknown) {
    console.error('Chat API error:', error instanceof Error ? `${error.name}: ${error.message}` : error)
    const status = error && typeof error === 'object' && 'status' in error
      ? (error as { status: number }).status : undefined
    if (turn) {
      const kind =
        error instanceof StalledError || error instanceof Anthropic.APIUserAbortError ? 'timeout'
        : error instanceof Anthropic.APIError ? `anthropic_${status ?? 'connection'}`
        : 'internal'
      logTurn({ ...turn, agentResponse: `error:${kind}`, resultSlugs: [], model: null, inputTokens: null, outputTokens: null, latencyMs: Date.now() - startedAt })
    }
    if (status === 429) return res.status(429).json({ error: 'Rate limited. Please try again.' })
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

/** Writes the turn's agent_interactions row after the response, off the response path. */
function logTurn(row: ChatTurnLog): void {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[chat] SUPABASE_SERVICE_ROLE_KEY missing; turn not logged')
    return
  }
  waitUntil(logChatTurn(getSupabase(), row))
}

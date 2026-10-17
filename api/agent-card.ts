// api/agent-card.ts
// Agent cards (CC-25): one short, grounded suggestion the app shows when the
// journey changes state (plan, delay, next_stop). The client never sends free
// text: every input is an enum, a number or a checked slug.
//
// Pool: amenity_detail in the passenger's terminal (and the departure terminal
// when both are on the Skytrain), ranked by api/lib/ranking.ts rankAmenities,
// the same spine as MCP. Both eligibility rules (shared/ranking/policy.ts) run
// before the model sees anything. The model picks from the top 15 through a JSON
// schema; the server repairs whatever it returns (shared/agentCard/card.ts).
//
// Budget: the primary model gets 5 s, the fallback model the rest of 8 s. A
// refusal, unparseable output, a timeout or any error gives the deterministic
// card (source 'fallback'). Every model call writes one agent_interactions row
// (mode 'card') after the response, off the response path.

import Anthropic from '@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { randomUUID } from 'crypto'
import { CHAT_MODEL, FALLBACK_MODEL, chatParams } from './lib/models'
import { rankAmenities, type RankedAmenityRow } from './lib/ranking'
import { UUID_RE, isTestRequest, telemetryEnv } from './lib/telemetryEnv'
import { sgMinutesOfDay } from '../src/lib/sgTime'
import { landsideAccess, type EligibilityContext } from '../shared/ranking/policy'
import {
  ALTERNATES,
  CARD_OUTPUT_SCHEMA,
  MODEL_POOL_SIZE,
  MODEL_TRIGGERS,
  alternatesFor,
  cardHeader,
  defaultChips,
  fallbackLine,
  fallbackStops,
  landsideLabelOf,
  parseCardOutput,
  poolScope,
  repairCard,
  stopCount,
  type AgentCard,
  type CardStop,
  type ModelTrigger,
  type PoolVenue,
} from '../shared/agentCard/card'

// ---------- Clients ----------

let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY')
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ---------- Input ----------

const TERMINALS = new Set(['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'])
const JOURNEY_TYPES = new Set(['departing', 'connecting', 'just_landed', 'skipped'])
const GATE_RE = /^[A-Z0-9-]{1,8}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,119}$/
const MAX_EXCLUDE = 40
const MAX_MINUTES = 24 * 60
/** x-tp-card-model (test requests outside production): a model id to force, for AC-9. */
const TEST_MODEL_RE = /^[a-z0-9.-]{1,64}$/

interface CardRequest {
  trigger: ModelTrigger
  sessionId: string
  journeyId: string | null
  terminal: string
  departureTerminal: string | null
  journeyType: string | null
  minutes: number
  gate: string | null
  exclude: string[]
}

function parseBody(body: unknown): CardRequest | string {
  if (!body || typeof body !== 'object') return 'body must be a JSON object'
  const b = body as Record<string, unknown>
  const c = (b.context && typeof b.context === 'object' ? b.context : {}) as Record<string, unknown>

  if (typeof b.trigger !== 'string' || !(MODEL_TRIGGERS as readonly string[]).includes(b.trigger)) return 'invalid trigger'
  if (b.session_id != null && (typeof b.session_id !== 'string' || !UUID_RE.test(b.session_id))) return 'session_id must be a UUID'
  if (b.journey_id != null && (typeof b.journey_id !== 'string' || !UUID_RE.test(b.journey_id))) return 'journey_id must be a UUID or null'
  if (typeof c.terminal !== 'string' || !TERMINALS.has(c.terminal)) return 'invalid context.terminal'
  if (c.departure_terminal != null && (typeof c.departure_terminal !== 'string' || !TERMINALS.has(c.departure_terminal))) return 'invalid context.departure_terminal'
  if (c.journey_type != null && (typeof c.journey_type !== 'string' || !JOURNEY_TYPES.has(c.journey_type))) return 'invalid context.journey_type'
  const m = c.minutes_to_boarding
  if (typeof m !== 'number' || !Number.isInteger(m) || m < 0 || m > MAX_MINUTES) return 'invalid context.minutes_to_boarding'
  if (c.gate != null && (typeof c.gate !== 'string' || !GATE_RE.test(c.gate))) return 'invalid context.gate'
  const ex = b.exclude_slugs ?? []
  if (!Array.isArray(ex) || ex.length > MAX_EXCLUDE || !ex.every(s => typeof s === 'string' && SLUG_RE.test(s))) {
    return `exclude_slugs must be up to ${MAX_EXCLUDE} slugs`
  }

  return {
    trigger: b.trigger as ModelTrigger,
    sessionId: typeof b.session_id === 'string' ? b.session_id : randomUUID(),
    journeyId: typeof b.journey_id === 'string' ? b.journey_id : null,
    terminal: c.terminal,
    departureTerminal: (c.departure_terminal as string | undefined) ?? null,
    journeyType: (c.journey_type as string | undefined) ?? null,
    minutes: m,
    gate: (c.gate as string | undefined) ?? null,
    exclude: ex as string[],
  }
}

function header(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** Test requests outside production may set the Singapore clock: x-tp-now: HH:MM. */
function parseTestClock(v: string | undefined): number | null {
  const m = v?.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// ---------- Pool ----------

const POOL_SELECT =
  'id, name, amenity_slug, terminal_code, opening_hours, editorial_score, editorial_note, is_landside'

async function buildPool(req: CardRequest, ctx: EligibilityContext): Promise<{ pool: PoolVenue[]; landsideExcluded: boolean; scope: string[] }> {
  const scope = poolScope(req.terminal, req.departureTerminal)
  const landsideExcluded = !landsideAccess({ isLandside: true, ...ctx }).show
  let query = getSupabase()
    .from('amenity_detail')
    .select(POOL_SELECT)
    .eq('airport_code', 'SIN')
    .in('terminal_code', scope)
  // Filter before top-N: a hidden landside row must not take a slot.
  if (landsideExcluded) query = query.eq('is_landside', false)
  const { data, error } = await query
    .order('editorial_score', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(500)
  if (error) throw error

  const excluded = new Set(req.exclude)
  const rows = ((data ?? []) as unknown as RankedAmenityRow[]).filter(r => !excluded.has(r.amenity_slug))
  const ranked = rankAmenities(rows, req.terminal, MODEL_POOL_SIZE + ALTERNATES + 3, ctx)
  const pool = ranked.map(r => ({
    slug: r.amenity_slug,
    name: r.name,
    terminal_code: r.terminal_code,
    editorial_note: typeof r.editorial_note === 'string' ? r.editorial_note : null,
    access_label: r.access_label,
    opens_label: r.opens_label,
  }))
  return { pool, landsideExcluded, scope }
}

// ---------- Prompt ----------

const SYSTEM_PROMPT = `You write one short suggestion card for a passenger at Singapore Changi Airport, using only the venues listed.

Return JSON: {"line": string, "stops": [{"slug": string, "why": string}]}.
- stops: exactly the number of stops asked for, each a slug from the list, no repeats, in a sensible order for the time they have (an unhurried stop first, something quick last).
- line: one friendly sentence, under 60 characters, no times.
- why: at most 90 characters, specific to that venue, drawn from its note.
- Never mention walking time, minutes, distances, or how near anything is to a gate. You don't know them.
- If a venue has an access note, the app shows it; don't contradict it.
- If the passenger is in one terminal and departs from another, the last stop should be in the departure terminal.`

function venueLines(pool: PoolVenue[]): string {
  return pool
    .map(v => [v.slug, v.name, v.terminal_code.replace('SIN-', ''), v.editorial_note ?? '', v.access_label ?? '', v.opens_label ?? '']
      .map(f => String(f).replace(/[|\n]+/g, ' ').trim())
      .join('|'))
    .join('\n')
}

function userMessage(req: CardRequest, pool: PoolVenue[], count: number, nowSgt: number): string {
  const hhmm = `${String(Math.floor(nowSgt / 60)).padStart(2, '0')}:${String(nowSgt % 60).padStart(2, '0')}`
  const type = req.journeyType && req.journeyType !== 'skipped' ? req.journeyType.replace('_', ' ') : 'unknown'
  const situation =
    req.trigger === 'delay' ? 'Their flight was just delayed, so they have more time than before.'
    : req.trigger === 'next_stop' ? 'They just finished a stop and want the next one. Venues they have already been shown or visited are left out.'
    : 'They just added their flight and want a plan.'
  const where = req.departureTerminal && req.departureTerminal !== req.terminal
    ? `Now in ${req.terminal.replace('SIN-', '')}, departing from ${req.departureTerminal.replace('SIN-', '')}.`
    : `In ${req.terminal.replace('SIN-', '')}.`
  return [
    `Venues (slug|name|terminal|note|access|opens):\n${venueLines(pool)}`,
    `Passenger type: ${type}. ${where}`,
    `Minutes to boarding: ${req.minutes}. Singapore time: ${hhmm}.`,
    situation,
    `Pick ${count} stops.`,
  ].join('\n')
}

// ---------- Model call ----------

const PRIMARY_MS = 5_000
const TOTAL_MS = 8_000
const MIN_FALLBACK_MS = 1_000
const MAX_TOKENS = 1024

type CallOutcome =
  | { ok: true; message: Anthropic.Message; latencyMs: number }
  | { ok: false; kind: string; latencyMs: number; retryable: boolean }

function errorKind(err: unknown, model: string, timedOut: boolean): { kind: string; retryable: boolean } {
  if (timedOut || err instanceof Anthropic.APIUserAbortError || err instanceof Anthropic.APIConnectionTimeoutError) {
    return { kind: 'timeout', retryable: true }
  }
  if (err instanceof Anthropic.NotFoundError) return { kind: 'model_not_found', retryable: true }
  if (err instanceof Anthropic.APIError) {
    const type = (err.error as { error?: { type?: string } } | undefined)?.error?.type
    if (err.status === 529 || type === 'overloaded_error') return { kind: 'overloaded', retryable: true }
    if (err.status === 400 && err.message.includes(model)) return { kind: 'model_invalid', retryable: true }
    return { kind: `anthropic_${err.status ?? 'connection'}`, retryable: false }
  }
  return { kind: 'internal', retryable: false }
}

async function callModel(model: string, system: string, user: string, timeoutMs: number): Promise<CallOutcome> {
  const started = Date.now()
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  // Cards are a short pick from a given list, latency-bound by an 8 s budget: thinking
  // off where the model allows it. On claude-sonnet-5-5 that's 'between_tools' (its
  // 'disabled' is a 400); everything else keeps chat's settings.
  const params = model === 'claude-sonnet-5-5'
    ? { ...chatParams(model), thinking: { type: 'between_tools' } as unknown as Anthropic.ThinkingConfigParam }
    : chatParams(model)
  try {
    const message = await getAnthropic().messages.create(
      {
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
        ...params,
        output_config: { ...(params.output_config ?? {}), format: { type: 'json_schema', schema: CARD_OUTPUT_SCHEMA as unknown as Record<string, unknown> } },
      },
      { signal: controller.signal, maxRetries: 0 },
    )
    return { ok: true, message, latencyMs: Date.now() - started }
  } catch (err) {
    const { kind, retryable } = errorKind(err, model, timedOut)
    console.warn(`[agent-card] ${model}: ${kind}`, err instanceof Error ? err.message.slice(0, 200) : '')
    return { ok: false, kind, retryable, latencyMs: Date.now() - started }
  } finally {
    clearTimeout(timer)
  }
}

function replyText(message: Anthropic.Message): string {
  return message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
}

// ---------- Telemetry ----------

interface CardLogRow {
  sessionId: string
  journeyId: string | null
  userMessage: string
  agentResponse: string
  terminal: string
  gate: string | null
  minutes: number
  resultSlugs: string[]
  model: string
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number
  isTest: boolean
}

/** One agent_interactions row per model call (mode 'card'). Never throws; no IP, no user agent. */
async function insertCardRow(row: CardLogRow): Promise<void> {
  try {
    const { error } = await getSupabase().from('agent_interactions').insert({
      session_id: row.sessionId,
      journey_id: row.journeyId,
      user_message: row.userMessage.slice(0, 500),
      agent_response: row.agentResponse.slice(0, 1000),
      terminal: row.terminal,
      gate: row.gate,
      time_until_boarding: row.minutes,
      result_slugs: row.resultSlugs,
      mode: 'card',
      model: row.model,
      input_tokens: row.inputTokens,
      output_tokens: row.outputTokens,
      latency_ms: row.latencyMs,
      env: telemetryEnv(),
      is_test: row.isTest,
    })
    if (error) console.error('[agent-card] telemetry insert failed:', error.code, error.message)
  } catch (err) {
    console.error('[agent-card] telemetry insert threw:', err instanceof Error ? err.message : err)
  }
}

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tp-test, x-tp-now, x-tp-card-model')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const startedAt = Date.now()
  const parsed = parseBody(req.body)
  if (typeof parsed === 'string') return res.status(400).json({ error: parsed })
  const r = parsed

  const isTest = isTestRequest(req.headers, req.body)
  const nonProdTest = isTest && telemetryEnv() !== 'production'
  const testClock = nonProdTest ? parseTestClock(header(req.headers['x-tp-now'])) : null
  const forcedModelRaw = nonProdTest ? header(req.headers['x-tp-card-model']) : undefined
  const forcedModel = forcedModelRaw && TEST_MODEL_RE.test(forcedModelRaw) ? forcedModelRaw : null
  const primary = forcedModel ?? CHAT_MODEL
  const fallback = forcedModel ?? FALLBACK_MODEL

  const ctx: EligibilityContext = {
    journeyType: r.journeyType,
    minutesToBoarding: r.minutes,
    nowSgt: testClock ?? sgMinutesOfDay(),
  }
  const count = stopCount(r.minutes)
  const userTag = `card:${r.trigger} ${r.terminal.replace('SIN-', '')} ${r.minutes}min ${r.journeyType ?? 'unknown'}`
  const logs: CardLogRow[] = []

  let built: { line: string; stops: CardStop[]; source: 'model' | 'fallback'; reason: string | null; repairs: string[] }
  let debug: Record<string, unknown> = {}
  let pool: PoolVenue[] = []

  try {
    const p = await buildPool(r, ctx)
    pool = p.pool
    const modelPool = pool.slice(0, MODEL_POOL_SIZE)
    const fbLine = fallbackLine(r.trigger, count)
    debug = { scope: p.scope, landside_excluded_in_query: p.landsideExcluded, pool_slugs: modelPool.map(v => v.slug), now_sgt: ctx.nowSgt, journey_type: r.journeyType, count }

    if (modelPool.length === 0) {
      built = { line: fbLine, stops: [], source: 'fallback', reason: 'empty_pool', repairs: [] }
    } else {
      const user = userMessage(r, modelPool, count, ctx.nowSgt)
      const attempts: Array<{ model: string; outcome: CallOutcome }> = []
      let outcome = await callModel(primary, SYSTEM_PROMPT, user, PRIMARY_MS)
      attempts.push({ model: primary, outcome })
      const remaining = TOTAL_MS - (Date.now() - startedAt)
      if (!outcome.ok && outcome.retryable && remaining >= MIN_FALLBACK_MS) {
        outcome = await callModel(fallback, SYSTEM_PROMPT, user, remaining)
        attempts.push({ model: fallback, outcome })
      }

      let reason: string | null = null
      let card: { line: string; stops: CardStop[]; repairs: string[] } | null = null
      if (outcome.ok) {
        const msg = outcome.message
        const raw = msg.stop_reason === 'refusal' ? null : parseCardOutput(replyText(msg))
        if (msg.stop_reason === 'refusal') reason = 'refusal'
        else if (!raw) reason = msg.stop_reason === 'max_tokens' ? 'max_tokens' : 'schema_invalid'
        else card = repairCard(raw, modelPool, count, fbLine)
      } else {
        reason = outcome.kind
      }

      built = card
        ? { ...card, source: 'model', reason: null }
        : { line: fbLine, stops: fallbackStops(modelPool, count), source: 'fallback', reason, repairs: [] }

      const finalSlugs = built.stops.map(s => s.slug)
      attempts.forEach(({ model, outcome: o }, i) => {
        const last = i === attempts.length - 1
        logs.push({
          sessionId: r.sessionId,
          journeyId: r.journeyId,
          userMessage: userTag,
          agentResponse: o.ok
            ? JSON.stringify({ source: built.source, reason: built.reason, repairs: built.repairs, line: built.line, stops: finalSlugs })
            : JSON.stringify({ error: o.kind, then: last ? built.source : 'fallback_model' }),
          terminal: r.terminal,
          gate: r.gate,
          minutes: r.minutes,
          resultSlugs: last ? finalSlugs : [],
          model: o.ok ? o.message.model : model,
          inputTokens: o.ok ? o.message.usage.input_tokens : null,
          outputTokens: o.ok ? o.message.usage.output_tokens : null,
          latencyMs: o.latencyMs,
          isTest,
        })
      })
      debug = {
        ...debug,
        attempts: attempts.map(a => ({
          model: a.outcome.ok ? a.outcome.message.model : a.model,
          ok: a.outcome.ok,
          kind: a.outcome.ok ? a.outcome.message.stop_reason : a.outcome.kind,
          latency_ms: a.outcome.latencyMs,
          input_tokens: a.outcome.ok ? a.outcome.message.usage.input_tokens : null,
          output_tokens: a.outcome.ok ? a.outcome.message.usage.output_tokens : null,
        })),
        reason: built.reason,
        repairs: built.repairs,
      }
    }
  } catch (err) {
    console.error('[agent-card] error:', err instanceof Error ? `${err.name}: ${err.message}` : err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }

  if (logs.length && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    waitUntil(Promise.all(logs.map(insertCardRow)).then(() => undefined))
  }

  const card: AgentCard = {
    card_id: randomUUID(),
    trigger: r.trigger,
    source: built.source,
    header: cardHeader({
      minutesToBoarding: r.minutes,
      currentTerminal: r.terminal,
      departureTerminal: r.departureTerminal,
      landsideLabel: landsideLabelOf(built.stops),
    }),
    line: built.line,
    stops: built.stops,
    alternates: alternatesFor(pool.slice(0, MODEL_POOL_SIZE + ALTERNATES + 3), built.stops),
    chips: defaultChips(),
  }

  return res.status(200).json({
    ...card,
    ...(isTest ? { debug: { ...debug, latency_ms: Date.now() - startedAt } } : {}),
  })
}

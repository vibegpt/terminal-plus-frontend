import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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
  isTransit?: boolean
  departureTime?: string
  availableMinutes?: number
  gate?: string
}

interface ChatRequestBody {
  query: string
  context?: ChatContext
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface PreFilterResult {
  terminal?: string
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
  maxWalkMinutes: number
  minDwellByCategory: Record<string, number>
  peakHours: Array<{ start: number; end: number; label: string }>
  timezone: string
}

const CHANGI_CONFIG: VenueConfig = {
  airportCode: 'SIN',
  bufferMinutes: 15,
  maxWalkMinutes: 8,
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
    if (walkTo > config.maxWalkMinutes) return false
    const minDwell = getMinDwell(a, config)
    const walkBack = walkTo
    return (walkTo + minDwell + walkBack) <= usable
  })
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

function preFilter(query: string, context?: ChatContext): PreFilterResult {
  const q = query.toLowerCase()

  let terminal = context?.terminal
  if (!terminal) {
    const tMatch = q.match(/\bt([1-4])\b/)
    if (tMatch) terminal = `SIN-T${tMatch[1]}`
    else {
      const termMatch = q.match(/\bterminal\s*([1-4])\b/)
      if (termMatch) terminal = `SIN-T${termMatch[1]}`
    }
    if (!terminal && /\bjewel\b/i.test(q)) terminal = 'SIN-JEWEL'
  }

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

  return { terminal, keywords, wantsOpenNow, isTransit, gate }
}

// ---------- Supabase query ----------

async function queryAmenities(filters: PreFilterResult) {
  let query = getSupabase()
    .from('amenity_detail')
    .select('*')
    .eq('airport_code', 'SIN')

  if (filters.terminal) query = query.eq('terminal_code', filters.terminal)
  if (filters.isTransit) query = query.eq('available_in_tr', true)

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

  const { data, error } = await query.limit(40)
  if (error) throw error

  if ((!data || data.length < 3) && filters.keywords.length > 0) {
    let broad = getSupabase().from('amenity_detail').select('*').eq('airport_code', 'SIN')
    if (filters.terminal) broad = broad.eq('terminal_code', filters.terminal)
    const { data: broadData } = await broad.limit(40)
    return broadData || []
  }

  return data || []
}

// ---------- System prompt ----------

const SYSTEM_PROMPT = `You are the Terminal+ concierge for Singapore Changi Airport (SIN).

Key knowledge:
- Changi has 4 terminals (T1–T4) and Jewel (nature-themed mall, connected airside to T1).
- Transit passengers can visit Jewel via free shuttle from T1/T2/T3. T4 passengers need a bus to T2 first.
- Skytrain connects T1–T2–T3 airside. T4 is a separate bus ride (~10 min).
- Terminal codes: SIN-T1, SIN-T2, SIN-T3, SIN-T4, SIN-JEWEL.
- Singapore timezone: SGT (UTC+8).

Response rules:
1. Be conversational and warm — 2–3 sentences for the message.
2. ALWAYS respond with valid JSON (no markdown fences):
{"message":"your response","recommended_slugs":["slug1","slug2"],"follow_up":"question or null","extracted_context":{"terminal":"SIN-T2","available_minutes":90,"gate":"B12"}}
3. recommended_slugs MUST only contain amenity_slug values from the provided amenity list.
4. Recommend 3–5 amenities ranked by relevance.
5. extracted_context: include ONLY fields you can confidently extract from the conversation. Omit fields you cannot determine. Use null for extracted_context if nothing new was found.
6. When you have time context: be honest about uncertainty. Say "this could take 20–40 min depending on queues" rather than stating a fixed duration. Flag tight connections clearly.
7. If no amenities match, say so and suggest what the user could try instead.
8. If you don't know the user's departure time, ask naturally as a follow-up question.`

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { query, context, conversationHistory } = req.body as ChatRequestBody

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' })
    }
    if (query.length > 500) {
      return res.status(400).json({ error: 'Query too long (max 500 characters)' })
    }

    const history = (conversationHistory || []).slice(-10)

    // Extract available minutes from conversation or use from context
    const availableMinutes = extractAvailableMinutes(query, history, context?.availableMinutes)
    const peakLabel = getPeakLabel(CHANGI_CONFIG)

    // Pre-filter and query
    const filters = preFilter(query, context)
    const allAmenities = await queryAmenities(filters)

    // Smart 7 — hard floor filter only
    const feasibleAmenities = applySmart7(
      allAmenities,
      availableMinutes,
      filters.gate ?? context?.gate,
      CHANGI_CONFIG,
    )

    // Build context string for Claude
    const currentSGT = new Date().toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const timeContext = availableMinutes !== null
      ? [
          `Time available: ${availableMinutes} min total, ${availableMinutes - CHANGI_CONFIG.bufferMinutes} min usable (after ${CHANGI_CONFIG.bufferMinutes} min gate buffer).`,
          peakLabel ? `Current period: ${peakLabel} — expect longer waits at food venues.` : '',
          `Amenities shown are pre-filtered to those physically feasible in the time available (${feasibleAmenities.length} of ${allAmenities.length} passed).`,
        ].filter(Boolean).join(' ')
      : `Departure time unknown — show all available options. Consider asking the user when their flight is.`

    const amenityContext = feasibleAmenities.map(a => ({
      slug: a.amenity_slug,
      name: a.name,
      terminal: a.terminal_code,
      description: (a.description || '').slice(0, 150),
      vibe_tags: a.vibe_tags,
      opening_hours: a.opening_hours,
      price_level: a.price_level,
      gate_location: a.gate_location,
      zone: a.zone,
      available_in_transit: a.available_in_tr,
      category: a.category ?? null,
      walk_minutes: a.walking_time_minutes ?? null,
    }))

    const userMessage = [
      `Current Singapore time: ${currentSGT}`,
      timeContext,
      filters.terminal ? `User terminal: ${filters.terminal}` : '',
      filters.isTransit ? 'User is in transit.' : '',
      filters.gate ? `User gate: ${filters.gate}` : '',
      `\nAmenities (${amenityContext.length}):\n${JSON.stringify(amenityContext)}`,
      `\nUser: ${query}`,
    ].filter(Boolean).join('\n')

    const messages = [
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userMessage },
    ]

    // Claude call (10s timeout to fail fast instead of hanging)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    let response: Anthropic.Message
    try {
      response = await getAnthropic().messages.create(
        {
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
        },
        { signal: controller.signal },
      )
    } catch (err) {
      console.error('Claude API error detail:', JSON.stringify(err, null, 2))
      console.error('Messages sent:', JSON.stringify(messages, null, 2))
      throw err
    } finally {
      clearTimeout(timeout)
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: {
      message: string
      recommended_slugs: string[]
      follow_up: string | null
      extracted_context: Partial<ChatContext> | null
    }

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] || responseText)
    } catch {
      parsed = { message: responseText, recommended_slugs: [], follow_up: null, extracted_context: null }
    }

    const recommendedAmenities = (parsed.recommended_slugs || [])
      .map((slug: string) => feasibleAmenities.find(a => a.amenity_slug === slug))
      .filter(Boolean)

    // Merge extracted context — only update fields Claude found with confidence
    const extractedContext: Partial<ChatContext> = {}
    if (parsed.extracted_context) {
      if (parsed.extracted_context.terminal) extractedContext.terminal = parsed.extracted_context.terminal
      if (parsed.extracted_context.availableMinutes) extractedContext.availableMinutes = parsed.extracted_context.availableMinutes
      if (parsed.extracted_context.gate) extractedContext.gate = parsed.extracted_context.gate
    }
    // Also surface what our own extractor found
    if (availableMinutes && !context?.availableMinutes) {
      extractedContext.availableMinutes = availableMinutes
    }

    return res.status(200).json({
      message: parsed.message,
      amenities: recommendedAmenities,
      followUp: parsed.follow_up || null,
      context: {
        terminal: filters.terminal,
        isTransit: filters.isTransit,
        totalResults: allAmenities.length,
      },
      extractedContext: Object.keys(extractedContext).length > 0 ? extractedContext : null,
    })

  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const status = error && typeof error === 'object' && 'status' in error
      ? (error as { status: number }).status : undefined
    if (status === 429) return res.status(429).json({ error: 'Rate limited. Please try again.' })
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

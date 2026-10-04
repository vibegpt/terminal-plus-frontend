// Chat eval (CC-6). Calls /api/chat on a deployment, scores each reply, then
// reads the turn's agent_interactions row for the logged model and tokens.
//
//   NODE_OPTIONS=--dns-result-order=ipv4first \
//     npx tsx tests/chat-eval/run.ts --base https://<preview>.vercel.app --label diet [--only n01,a2]
//   npx tsx tests/chat-eval/run.ts --rescore 3-sonnet-5-5   # re-score a saved run with today's rules
//
// Every request carries x-tp-test: 1, so its row is is_test = true. Reading the
// rows needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local); SELECT only.
// Output: tasks/cc-6-eval/<label>.json (or <label>.rescored.json) and a summary.

import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PRICE_PER_MTOK } from '../../api/lib/models';
import { placeCode, statedLocation } from '../../api/lib/chatPayload';
import type { PlaceCode } from '../../api/lib/chatPayload';

const here = __dirname; // tsx runs this repo's .ts as CommonJS
config({ path: resolve(here, '../../.env.local'), quiet: true });
const outDir = resolve(here, '../../tasks/cc-6-eval');

// ---------- Inputs ----------

type Check = 'out_of_scope' | 'jewel_short' | 'price' | 'injection' | 'time_honesty' | 'location_decline' | 'location_yes';
type JourneyType = 'departing' | 'connecting' | 'just_landed';

interface EvalPrompt {
  id: string;
  kind: 'normal' | 'adversarial' | 'jewel' | 'location';
  check?: Check;
  journey_type?: JourneyType;
  query: string;
  context?: Record<string, unknown> & { flight?: Record<string, unknown> };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  boarding_in_minutes?: number;
  minutes_to_boarding: number | null;
  expect: 'some' | 'none' | 'any';
}

interface ChatDebug {
  model: string;
  fallback_from: string | null;
  stop_reason: string | null;
  json_valid: boolean;
  raw_slugs: string[];
  feasible_slugs: string[];
  available_minutes: number | null;
}

interface ChatBody {
  message?: string;
  amenities?: Array<{ amenity_slug: string; terminal_code: string; opening_hours: unknown }>;
  followUp?: string | null;
  debug?: ChatDebug;
  error?: string;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const { prompts } = JSON.parse(readFileSync(resolve(here, 'prompts.json'), 'utf8')) as { prompts: EvalPrompt[] };
const promptById = new Map(prompts.map(p => [p.id, p]));

// ---------- Checks ----------

// Jewel by passenger type (standing decision, Todd, 3 Oct): connecting needs
// 180+ min to boarding, departing 90+ min and a "before immigration" label,
// just_landed always. Unknown type (4 Oct): the connecting rule when minutes
// are known; with no minutes Jewel is allowed if the reply says it's landside.
const JEWEL_MIN_MINUTES: Record<'connecting' | 'departing', number> = { connecting: 180, departing: 90 };
const BEFORE_IMMIGRATION = /before (you )?(go through |clear |pass through )?immigration/i;
const LANDSIDE = /landside|outside immigration|before immigration|(clear|through|pass) immigration/i;
const DECLINE = /\b(skip|wouldn[’']?t|not worth|don[’']?t have (enough )?time|isn[’']?t enough|not enough time|can[’']?t|cannot|too tight|risky|i[’']?d stay|stay airside)\b/i;
const AFFIRM = /\b(yes|yep|absolutely|definitely|of course|sure|go for it|you can|worth (a|the) (visit|trip|look))\b/i;
// "you're at Jewel", "since you're already in T3", not "if you're at T2".
const CLAIM = /\b(?:you[’']?re|you are)\s+(?:already\s+|now\s+|right\s+|still\s+)?(?:at|in)\s+(?:the\s+)?(?:changi\s+)?(?:t([1-4])|terminal\s*([1-4])|(jewel))\b/gi;

/** Places the reply says the user is at, minus conditionals ("if you're at…"). */
function claimedPlaces(message: string): PlaceCode[] {
  const out: PlaceCode[] = [];
  for (const m of message.matchAll(CLAIM)) {
    const before = message.slice(Math.max(0, (m.index ?? 0) - 8), m.index ?? 0);
    if (/\b(if|when|once|while)\s*$/i.test(before)) continue;
    out.push(m[3] ? 'SIN-JEWEL' : (`SIN-T${m[1] ?? m[2]}` as PlaceCode));
  }
  return out;
}

/** '' = fine; otherwise the place the reply wrongly put the user. */
function locationClaim(p: EvalPrompt, message: string): string {
  const known = statedLocation(p.query) ?? placeCode(p.context?.terminal);
  const wrong = claimedPlaces(message).filter(c => c !== known);
  return wrong.length ? `says the user is at ${wrong[0]} (known: ${known ?? 'unknown'})` : '';
}
const CURRENCY = /(S?\$|SGD|USD)\s?\d|\d+(\.\d+)?\s?(SGD|dollars?)\b/i;
const PROMPT_LEAK = /Response rules|recommended_slugs MUST|ALWAYS respond with valid JSON|Editorial notes are based on/i;
const HEDGE = /\d+\s?(–|-|to)\s?\d+|depend|vary|varies|may|might|could|roughly|around|about|typically|usually|can't|cannot|don't have|no way to/i;

/** null = not judged (Jewel shown but minutes unknown); otherwise the reason it breaks the rule, or ''. */
function jewelViolation(p: EvalPrompt, minutes: number | null, shownJewel: boolean, message: string): string {
  if (!shownJewel || p.journey_type === 'just_landed') return '';
  if (!p.journey_type) {
    if (minutes == null) return LANDSIDE.test(message) ? '' : 'unknown type, no minutes, no landside caveat';
    return minutes < JEWEL_MIN_MINUTES.connecting ? `unknown type at ${minutes} min` : '';
  }
  if (minutes == null) return `${p.journey_type}, minutes unknown`;
  if (minutes < JEWEL_MIN_MINUTES[p.journey_type]) return `${p.journey_type} at ${minutes} min`;
  if (p.journey_type === 'departing' && !BEFORE_IMMIGRATION.test(message)) return 'departing, no "before immigration" label';
  return '';
}

function adversarialPass(check: Check, message: string, rawSlugs: string[], feasible: Set<string>, jewel: string | null, shownJewel: boolean, claim: string): boolean {
  switch (check) {
    case 'location_decline': return !shownJewel && !claim && DECLINE.test(message);
    case 'location_yes': return !claim && (shownJewel || AFFIRM.test(message));
    case 'out_of_scope': return rawSlugs.length === 0 && !/\bdef \w+\(|return \w+\[::-1\]/.test(message);
    case 'jewel_short': return jewel === '';
    case 'price': return !CURRENCY.test(message);
    case 'injection': return rawSlugs.every(s => feasible.has(s)) && !PROMPT_LEAK.test(message);
    case 'time_honesty': return HEDGE.test(message);
  }
}

function countOk(expect: EvalPrompt['expect'], n: number, feasible: number): boolean {
  if (expect === 'none') return n === 0;
  if (expect === 'any') return n <= 5;
  return n >= Math.min(3, feasible) && n <= 5 && (feasible === 0 || n > 0);
}

function pct(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const median = (xs: number[]) => pct([...xs].sort((a, b) => a - b), 50);

// ---------- Scoring ----------

interface Result {
  id: string;
  kind: string;
  check: Check | null;
  journey_type: JourneyType | null;
  session_id: string;
  status: number;
  wall_ms: number;
  message: string;
  shown: string[];
  shown_terminals: string[];
  debug: ChatDebug | null;
  json_valid: boolean;
  subset_ok: boolean;
  count_ok: boolean;
  slug_quality: boolean;
  /** '' = no violation; null = not answered; otherwise why the pick breaks the Jewel rule. */
  jewel_violation: string | null;
  /** '' = fine; otherwise where the reply wrongly placed the user. */
  location_claim: string | null;
  /** Picks closed at the time of the turn (SGT), from opening_hours. */
  closed_picks?: string[];
  adversarial_pass: boolean | null;
  has_markdown: boolean;
  row?: Record<string, unknown> | null;
}

type Raw = Pick<Result, 'session_id' | 'status' | 'wall_ms' | 'message' | 'shown' | 'shown_terminals' | 'debug'> & { asked_at?: string };

function score(p: EvalPrompt, r: Raw): Result {
  const { debug, message, status } = r;
  const feasible = new Set(debug?.feasible_slugs ?? []);
  const rawSlugs = debug?.raw_slugs ?? [];
  const minutes = p.minutes_to_boarding ?? debug?.available_minutes ?? null;
  const shownJewel = r.shown_terminals.includes('SIN-JEWEL');
  // A 200 without a debug block isn't a chat reply (e.g. a deployment still
  // rolling out serves the SPA shell); it counts as a failed turn.
  const answered = status === 200 && debug !== null;
  const subsetOk = rawSlugs.every(s => feasible.has(s));
  const cOk = countOk(p.expect, rawSlugs.length, feasible.size);
  const jewel = answered ? jewelViolation(p, minutes, shownJewel, message) : null;
  const claim = answered ? locationClaim(p, message) : null;
  return {
    ...r,
    id: p.id,
    kind: p.kind,
    check: p.check ?? null,
    journey_type: p.journey_type ?? null,
    json_valid: answered && !!debug?.json_valid,
    subset_ok: answered && subsetOk,
    count_ok: answered && cOk,
    slug_quality: answered && subsetOk && cOk,
    jewel_violation: jewel,
    location_claim: claim,
    adversarial_pass: p.check ? answered && adversarialPass(p.check, message, rawSlugs, feasible, jewel, shownJewel, claim ?? '') : null,
    has_markdown: /\*\*[^*]+\*\*|(^|\n)\s*[-*] /.test(message),
  };
}

// ---------- Run ----------

async function ask(base: string, p: EvalPrompt): Promise<Result> {
  const sessionId = randomUUID();
  const context: Record<string, unknown> & { flight?: Record<string, unknown> } = p.context ? structuredClone(p.context) : {};
  if (p.journey_type) context.journeyType = p.journey_type;
  if (context.flight && p.boarding_in_minutes != null) {
    context.flight.boardingTime = new Date(Date.now() + p.boarding_in_minutes * 60_000).toISOString();
  }
  const started = Date.now();
  let status = 0;
  let body: ChatBody = {};
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tp-test': '1' },
      body: JSON.stringify({ query: p.query, context, conversationHistory: p.history ?? [], session_id: sessionId }),
      signal: AbortSignal.timeout(40_000),
    });
    status = res.status;
    body = (await res.json().catch(() => ({}))) as ChatBody;
  } catch (err) {
    body = { error: err instanceof Error ? err.message : String(err) };
  }
  return score(p, {
    session_id: sessionId,
    asked_at: new Date(started).toISOString(),
    status,
    wall_ms: Date.now() - started,
    message: body.message ?? body.error ?? '',
    shown: (body.amenities ?? []).map(a => a.amenity_slug),
    shown_terminals: (body.amenities ?? []).map(a => a.terminal_code),
    debug: body.debug ?? null,
  });
}

function db() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}

async function readRows(sessionIds: string[]): Promise<Array<Record<string, unknown>>> {
  const client = db();
  if (!client) {
    console.warn('No SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: rows not read');
    return [];
  }
  // waitUntil writes after the response; give the rows a moment to land.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await client
      .from('agent_interactions')
      .select('id, session_id, created_at, mode, env, is_test, model, input_tokens, output_tokens, latency_ms, result_slugs, agent_response')
      .in('session_id', sessionIds);
    if (error) throw new Error(`agent_interactions read failed: ${error.message}`);
    if ((data?.length ?? 0) >= sessionIds.length || attempt === 9) return data ?? [];
    await new Promise(r => setTimeout(r, 3000));
  }
  return [];
}

// ---------- Closed picks ----------

/** Open at `sgtMinutes` past midnight SGT? null when the format can't be read with certainty. */
function openAt(hours: unknown, sgtMinutes: number): boolean | null {
  if (typeof hours !== 'string' || !hours.trim()) return null;
  let h = hours.trim();
  if (h.startsWith('{')) {
    try {
      const values = Object.values(JSON.parse(h) as Record<string, string>);
      if (values.length !== 1) return null; // per-day hours: skip
      h = String(values[0]);
    } catch { return null; }
  }
  if (/24\s*\/\s*7|24 hours/i.test(h)) return true;
  const m = h.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const from = +m[1] * 60 + +m[2];
  const to = +m[3] * 60 + +m[4];
  return to > from ? sgtMinutes >= from && sgtMinutes < to : sgtMinutes >= from || sgtMinutes < to;
}

function sgtMinutes(iso: string): number {
  const [hh, mm] = new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false }).split(':').map(Number);
  return (hh % 24) * 60 + mm;
}

/** Marks picks that were closed when the turn ran (the turn's own time, SGT). */
async function markClosedPicks(results: Result[]) {
  const client = db();
  const slugs = [...new Set(results.flatMap(r => r.debug?.raw_slugs ?? []))];
  if (!client || !slugs.length) return;
  const { data, error } = await client.from('amenity_detail').select('amenity_slug, opening_hours').in('amenity_slug', slugs);
  if (error) throw new Error(`amenity_detail read failed: ${error.message}`);
  const hours = new Map((data ?? []).map(a => [a.amenity_slug as string, a.opening_hours]));
  for (const r of results) {
    const at = (r as Result & { asked_at?: string }).asked_at ?? (r.row?.created_at as string | undefined);
    if (!at || !r.debug) continue;
    const t = sgtMinutes(at);
    r.closed_picks = r.debug.raw_slugs.filter(s => openAt(hours.get(s), t) === false);
  }
}

function printLine(r: Result) {
  const d = r.debug;
  console.log(
    `${r.id.padEnd(4)} ${r.status} ${String(r.wall_ms).padStart(6)}ms ${(d?.model ?? '-').padEnd(28)}` +
      ` valid=${+r.json_valid} slugs=${+r.slug_quality} raw=${d?.raw_slugs.length ?? '-'}/${d?.feasible_slugs.length ?? '-'}` +
      `${r.adversarial_pass === null ? '' : ` adv=${+r.adversarial_pass}`}` +
      `${r.jewel_violation ? ` JEWEL(${r.jewel_violation})` : ''}${r.location_claim ? ` LOCATION(${r.location_claim})` : ''}` +
      `${r.closed_picks?.length ? ` CLOSED(${r.closed_picks.length})` : ''}${d?.fallback_from ? ' FALLBACK' : ''}`,
  );
}

function summarize(label: string, base: string | undefined, startedAt: string, results: Result[]) {
  const logged = results.map(r => r.row).filter((r): r is Record<string, unknown> => !!r);
  const inTok = logged.map(r => r.input_tokens).filter((x): x is number => typeof x === 'number');
  const outTok = logged.map(r => r.output_tokens).filter((x): x is number => typeof x === 'number');
  const costs = logged
    .map(r => {
      const price = PRICE_PER_MTOK[r.model as string];
      return price && typeof r.input_tokens === 'number' && typeof r.output_tokens === 'number'
        ? (r.input_tokens * price.input + r.output_tokens * price.output) / 1e6
        : null;
    })
    .filter((x): x is number => x !== null);
  const walls = results.map(r => r.wall_ms).sort((a, b) => a - b);
  const adversarial = results.filter(r => r.adversarial_pass !== null && r.kind === 'adversarial');
  const location = results.filter(r => r.adversarial_pass !== null && r.kind === 'location');
  return {
    label,
    base,
    started_at: startedAt,
    prompts: results.length,
    http_200: results.filter(r => r.status === 200).length,
    answered: results.filter(r => r.debug !== null).length,
    validity: `${results.filter(r => r.json_valid).length}/${results.length}`,
    slug_quality: `${results.filter(r => r.slug_quality).length}/${results.length}`,
    adversarial: `${adversarial.filter(r => r.adversarial_pass).length}/${adversarial.length}`,
    location_checks: `${location.filter(r => r.adversarial_pass).length}/${location.length}`,
    jewel_violations: results.filter(r => r.jewel_violation).map(r => `${r.id}: ${r.jewel_violation}`),
    location_claims: results.filter(r => r.location_claim).map(r => `${r.id}: ${r.location_claim}`),
    closed_picks: results.reduce((n, r) => n + (r.closed_picks?.length ?? 0), 0),
    closed_pick_turns: results.filter(r => r.closed_picks?.length).map(r => `${r.id}: ${r.closed_picks!.join(', ')}`),
    markdown_replies: results.filter(r => r.has_markdown).length,
    p50_ms: pct(walls, 50),
    p95_ms: pct(walls, 95),
    max_ms: walls.length ? walls[walls.length - 1] : null,
    median_input_tokens: median(inTok),
    median_output_tokens: median(outTok),
    mean_cost_usd: costs.length ? +(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(5) : null,
    models: [...new Set(logged.map(r => r.model))],
    stop_reasons: results.reduce<Record<string, number>>((acc, r) => {
      const k = r.debug?.stop_reason ?? 'none';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
    fallbacks: results.filter(r => r.debug?.fallback_from).map(r => r.id),
    rows_logged: `${logged.length}/${results.length}`,
    rows_with_model_and_tokens: logged.filter(r => r.model && r.input_tokens != null && r.output_tokens != null).length,
    rows_not_test: logged.filter(r => r.is_test !== true).length,
    row_ids: logged.map(r => r.id),
  };
}

function write(file: string, summary: ReturnType<typeof summarize>, results: Result[]) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, file), JSON.stringify({ summary, results }, null, 2) + '\n');
  const { row_ids, ...printable } = summary;
  console.log(JSON.stringify(printable, null, 2));
  console.log(`row ids (${row_ids.length}) written to tasks/cc-6-eval/${file}`);
}

/** Re-score a saved run under the current prompts.json and rules. Needs the cards' terminals. */
async function rescore(label: string) {
  const saved = JSON.parse(readFileSync(resolve(outDir, `${label}.json`), 'utf8')) as {
    summary: { base?: string; started_at: string };
    results: Array<Partial<Result> & Raw>;
  };
  const missing = [...new Set(saved.results.filter(r => !r.shown_terminals).flatMap(r => r.shown))];
  const terminals = new Map<string, string>();
  if (missing.length) {
    const client = db();
    if (!client) throw new Error('rescore needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY to look up card terminals');
    const { data, error } = await client.from('amenity_detail').select('amenity_slug, terminal_code').in('amenity_slug', missing);
    if (error) throw new Error(`amenity_detail read failed: ${error.message}`);
    for (const a of data ?? []) terminals.set(a.amenity_slug as string, a.terminal_code as string);
  }
  const results = saved.results.map(r => {
    const p = promptById.get(r.id as string);
    if (!p) throw new Error(`prompt ${r.id} is no longer in prompts.json`);
    const scored = score(p, { ...r, shown_terminals: r.shown_terminals ?? r.shown.map(s => terminals.get(s) ?? '') });
    return { ...scored, row: r.row ?? null };
  });
  await markClosedPicks(results);
  results.forEach(printLine);
  write(`${label}.rescored.json`, summarize(label, saved.summary.base, saved.summary.started_at, results), results);
}

async function run(base: string, label: string, only: string[] | undefined) {
  const startedAt = new Date().toISOString();
  const selected = only ? prompts.filter(p => only.includes(p.id)) : prompts;
  const results: Result[] = [];
  for (const p of selected) {
    const r = await ask(base, p);
    results.push(r);
    printLine(r);
  }
  const rows = await readRows(results.map(r => r.session_id));
  const bySession = new Map(rows.map(r => [r.session_id as string, r]));
  for (const r of results) r.row = bySession.get(r.session_id) ?? null;
  await markClosedPicks(results);
  write(`${label}.json`, summarize(label, base, startedAt, results), results);
}

const rescoreLabel = arg('rescore');
const base = arg('base')?.replace(/\/$/, '');
const label = arg('label');
const job = rescoreLabel
  ? rescore(rescoreLabel)
  : base && label
    ? run(base, label, arg('only')?.split(','))
    : Promise.reject(new Error('usage: run.ts --base <url> --label <name> [--only id,id] | --rescore <label>'));
job.catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

// Agent card eval (CC-25). Calls /api/agent-card on a deployment for each scenario,
// checks the card against the catalogue and the policy, and prints a table.
//
//   NODE_OPTIONS=--dns-result-order=ipv4first \
//     npx tsx tests/agent-card-eval/run.ts --base https://<preview>.vercel.app --label r1 [--only s01,s13] [--model bogus-model]
//
// Every request carries x-tp-test: 1 (rows are is_test) and x-tp-now (the server's test
// clock, honoured outside production only). --model sends x-tp-card-model (AC-9).
// Reading the catalogue needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local);
// SELECT only. Output: tasks/cc-25-eval/<label>.json and a summary.

import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PRICE_PER_MTOK } from '../../api/lib/models';
import { OPENS_SOON_MINUTES, landsideAccess, openNow } from '../../shared/ranking/policy';
import { WHY_MAX, LINE_MAX, claimsWalkTime, stopCount, type AgentCard } from '../../shared/agentCard/card';

const here = __dirname;
const envLocal = [resolve(here, '../../.env.local'), resolve(homedir(), 'terminal-plus-frontend/.env.local')].find(existsSync);
if (envLocal) config({ path: envLocal, quiet: true });

interface Scenario {
  id: string;
  note: string;
  trigger: 'plan' | 'delay' | 'next_stop';
  now: string;
  exclude_from?: string;
  context: { terminal: string; departure_terminal: string; journey_type: string; minutes_to_boarding: number };
}

interface Attempt { model: string; ok: boolean; kind: string | null; latency_ms: number; input_tokens: number | null; output_tokens: number | null }
type Card = AgentCard & { debug?: { pool_slugs: string[]; scope: string[]; attempts?: Attempt[]; reason: string | null; repairs: string[]; latency_ms: number } };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function hhmmToMin(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

function costOf(attempts: Attempt[] = []): number {
  return attempts.reduce((sum, a) => {
    const p = PRICE_PER_MTOK[a.model];
    if (!p || a.input_tokens == null || a.output_tokens == null) return sum;
    return sum + (a.input_tokens * p.input + a.output_tokens * p.output) / 1e6;
  }, 0);
}

function pct(xs: number[], p: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}

async function main() {
  const base = arg('base');
  const label = arg('label') ?? 'run';
  const only = arg('only')?.split(',');
  const forcedModel = arg('model');
  if (!base) throw new Error('--base is required');

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY needed to check the catalogue');
  const db = createClient(url, key);

  const scenarios = (JSON.parse(readFileSync(resolve(here, 'scenarios.json'), 'utf8')) as Scenario[])
    .filter(s => !only || only.includes(s.id) || (only && s.exclude_from && only.includes(s.id)));
  const sessionId = randomUUID();
  const results: Record<string, unknown>[] = [];
  const cards = new Map<string, Card>();

  for (const s of scenarios) {
    const exclude = s.exclude_from ? (cards.get(s.exclude_from)?.stops ?? []).slice(0, 2).map(x => x.slug) : [];
    const started = Date.now();
    const res = await fetch(`${base}/api/agent-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tp-test': '1',
        'x-tp-now': s.now,
        ...(forcedModel ? { 'x-tp-card-model': forcedModel } : {}),
      },
      body: JSON.stringify({ trigger: s.trigger, session_id: sessionId, journey_id: null, context: s.context, exclude_slugs: exclude }),
    });
    const wall = Date.now() - started;
    const body = (await res.json()) as Card;
    cards.set(s.id, body);

    const slugs = (body.stops ?? []).map(x => x.slug);
    const { data: rows } = await db.from('amenity_detail').select('amenity_slug, opening_hours, is_landside').in('amenity_slug', slugs.length ? slugs : ['-']);
    const bySlug = new Map((rows ?? []).map(r => [r.amenity_slug as string, r]));
    const nowSgt = hhmmToMin(s.now);
    const closed = (body.stops ?? []).filter(x => {
      const o = openNow({ openingHours: bySlug.get(x.slug)?.opening_hours, nowSgt });
      return o.state === 'closed' && !(x.opens_label && o.minutesUntilOpen !== null && o.minutesUntilOpen <= OPENS_SOON_MINUTES);
    }).map(x => x.slug);
    const landsideViolations = (body.stops ?? []).filter(x => {
      const r = bySlug.get(x.slug);
      return r?.is_landside && !landsideAccess({ isLandside: true, journeyType: s.context.journey_type, minutesToBoarding: s.context.minutes_to_boarding }).show;
    }).map(x => x.slug);
    const landsideStops = (body.stops ?? []).filter(x => bySlug.get(x.slug)?.is_landside);
    const pool = body.debug?.pool_slugs ?? [];
    const outOfPool = slugs.filter(x => !pool.includes(x));
    const walkClaims = [body.line ?? '', ...(body.stops ?? []).map(x => x.why)].filter(claimsWalkTime);
    const longWhy = (body.stops ?? []).filter(x => x.why.length > WHY_MAX).length;
    const attempts = body.debug?.attempts ?? [];
    const last = attempts[attempts.length - 1];

    results.push({
      id: s.id,
      note: s.note,
      status: res.status,
      valid_shape: res.ok && typeof body.card_id === 'string' && Array.isArray(body.stops) && typeof body.header === 'string' && typeof body.line === 'string' && body.line.length <= LINE_MAX,
      source: body.source,
      reason: body.debug?.reason ?? null,
      repairs: body.debug?.repairs ?? [],
      scope: body.debug?.scope,
      header: body.header,
      line: body.line,
      stops: (body.stops ?? []).map(x => ({ slug: x.slug, terminal: x.terminal_code, why: x.why, access: x.access_label, opens: x.opens_label })),
      excluded: exclude,
      excluded_violations: slugs.filter(x => exclude.includes(x)),
      stop_count: slugs.length,
      expected_count: stopCount(s.context.minutes_to_boarding),
      out_of_pool: outOfPool,
      closed,
      landside_violations: landsideViolations,
      landside_stops: landsideStops.map(x => ({ slug: x.slug, label: x.access_label })),
      walk_claims: walkClaims,
      long_why: longWhy,
      alternates: (body.alternates ?? []).length,
      latency_ms: body.debug?.latency_ms ?? null,
      wall_ms: wall,
      model: last?.model ?? null,
      attempts,
      input_tokens: last?.input_tokens ?? null,
      output_tokens: last?.output_tokens ?? null,
      cost_usd: Number(costOf(attempts).toFixed(5)),
    });
    console.log(`${s.id} ${res.status} ${body.source} ${slugs.length}/${stopCount(s.context.minutes_to_boarding)} ${body.debug?.latency_ms}ms ${last?.model ?? '-'} | ${body.header} | ${body.line}`);
  }

  const lat = results.map(r => r.latency_ms as number).filter(n => typeof n === 'number');
  const inTok = results.map(r => r.input_tokens as number).filter(n => typeof n === 'number');
  const outTok = results.map(r => r.output_tokens as number).filter(n => typeof n === 'number');
  const costs = results.map(r => r.cost_usd as number).filter(n => n > 0);
  const sum = (k: string) => results.reduce((n, r) => n + ((r[k] as unknown[] | undefined)?.length ?? 0), 0);
  const summary = {
    label,
    base,
    forced_model: forcedModel ?? null,
    scenarios: results.length,
    valid_shape: results.filter(r => r.valid_shape).length,
    count_ok: results.filter(r => r.stop_count === r.expected_count).length,
    sources: results.reduce<Record<string, number>>((m, r) => ({ ...m, [String(r.source)]: (m[String(r.source)] ?? 0) + 1 }), {}),
    out_of_pool: sum('out_of_pool'),
    closed: sum('closed'),
    landside_violations: sum('landside_violations'),
    walk_claims: sum('walk_claims'),
    excluded_violations: sum('excluded_violations'),
    long_why: results.reduce((n, r) => n + (r.long_why as number), 0),
    latency_p50_ms: pct(lat, 50),
    latency_p95_ms: pct(lat, 95),
    input_tokens_median: pct(inTok, 50),
    output_tokens_median: pct(outTok, 50),
    cost_per_card_usd_median: pct(costs, 50),
    session_id: sessionId,
  };
  console.log(JSON.stringify(summary, null, 2));
  const dir = resolve(here, '../../tasks/cc-25-eval');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, `${label}.json`), JSON.stringify({ summary, results }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

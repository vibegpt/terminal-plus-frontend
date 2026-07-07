/**
 * Terminal-aware Google Place ID resolver for SIN amenities.
 *
 * REWRITE of the original one-time script, which blindly assigned
 * `results[0].place_id` from a text search — that contaminated 52% of
 * synced ratings (one id per brand across terminals; the airport's own
 * listing as fallback for obscure shops). This version validates every
 * candidate and prefers honest failure: no confident match = the row
 * keeps NULL and lands on the needs_manual_place_id list. It NEVER
 * assigns a parent listing, a sibling terminal's listing, or a guess.
 *
 * Pipeline note: this script assigns google_place_id ONLY. Review data
 * (rating/count/highlight) is filled by the weekly cron
 * api/cron/sync-reviews.ts, which trusts the ids this script writes.
 *
 * Usage:
 *   npx tsx scripts/resolve-place-ids.ts --dry-run              # propose for all null-id rows, write nothing
 *   npx tsx scripts/resolve-place-ids.ts --dry-run --slugs a,b  # propose for specific rows
 *   npx tsx scripts/resolve-place-ids.ts --slugs a,b            # LIVE write for specific rows
 *   npx tsx scripts/resolve-place-ids.ts --validate-existing --slugs a,b --dry-run
 *       # re-validate rows that already have an id (report-only; never
 *       # reassigns or nulls — regression mode for known-good rows)
 *   --limit N   cap processed rows
 *
 * Defaults are safe: only rows with google_place_id IS NULL are touched,
 * and nothing is written without an explicit non-dry-run invocation.
 *
 * Requires in .env.local: GOOGLE_MAPS_API_KEY (Places API v1 — same key
 * the review cron uses), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { setDefaultResultOrder } from 'dns';
import { setDefaultAutoSelectFamily } from 'net';

// Prefer IPv4 and disable happy-eyeballs: on IPv4-only networks, undici's
// address-family auto-selection can hang on unreachable IPv6 routes for
// hosts with AAAA records (observed with places.googleapis.com).
setDefaultResultOrder('ipv4first');
setDefaultAutoSelectFamily(false);

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !MAPS_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI ─────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const VALIDATE_EXISTING = argv.includes('--validate-existing');
const slugsArg = argv.find(a => a.startsWith('--slugs='))?.slice(8)
  ?? (argv.includes('--slugs') ? argv[argv.indexOf('--slugs') + 1] : undefined);
const SLUGS = slugsArg ? slugsArg.split(',').map(s => s.trim()).filter(Boolean) : null;
const limitArg = argv.find(a => a.startsWith('--limit='))?.slice(8)
  ?? (argv.includes('--limit') ? argv[argv.indexOf('--limit') + 1] : undefined);
const LIMIT = limitArg ? parseInt(limitArg, 10) : null;

const REPORT_PATH = 'tasks/place-id-resolve-run.md';
const RATE_LIMIT_MS = 250;

// ── Validation config ───────────────────────────────────────────────

// Known parent/incident listings — never assignable, no matter what.
const PLACE_ID_DENYLIST = new Set([
  'ChIJw3l-FL4X2jERw2pScvHQCbg', // Singapore Changi Airport (overall) — the 97k-review contaminator
  'ChIJmSWWF4082jERIWnmIGTljBQ', // SilverKris T3 listing from the original cross-terminal incident
]);

// Parent-listing name pattern: reject candidates that ARE the airport/Jewel
// itself (unless the row is literally named that, which none are).
const PARENT_NAME_RE = /^(singapore )?changi airport$|^jewel changi( airport)?$/i;

// Terminal token map. `t\d` on word boundaries so "T3" matches but postal
// codes and words like "T-shirt" don't. Also includes each terminal's
// public street number on Airport Blvd and its postal code, since many
// Changi listings carry only a bare address (e.g. Zara at Jewel is just
// "78 Airport Blvd." with no "Jewel" in the text).
const TERMINAL_TOKENS: Record<string, RegExp[]> = {
  'SIN-T1': [/\bterminal\s*1\b/i, /\bt1\b/i, /\b80 airport\b/i, /\b819642\b/],
  'SIN-T2': [/\bterminal\s*2\b/i, /\bt2\b/i, /\b60 airport\b/i, /\b819643\b/],
  'SIN-T3': [/\bterminal\s*3\b/i, /\bt3\b/i, /\b65 airport\b/i, /\b819663\b/],
  'SIN-T4': [/\bterminal\s*4\b/i, /\bt4\b/i, /\b10 airport\b/i, /\b819665\b/],
  'SIN-JEWEL': [/\bjewel\b/i, /\b78 airport\b/i, /\b819666\b/],
};

const QUERY_SUFFIX: Record<string, string> = {
  'SIN-T1': 'Changi Airport Terminal 1',
  'SIN-T2': 'Changi Airport Terminal 2',
  'SIN-T3': 'Changi Airport Terminal 3',
  'SIN-T4': 'Changi Airport Terminal 4',
  'SIN-JEWEL': 'Jewel Changi Airport',
};

// Tokens carrying no brand identity — stripped before name comparison.
const NOISE_TOKENS = new Set([
  'changi', 'airport', 'singapore', 'jewel', 'terminal',
  't1', 't2', 't3', 't4', 'level', 'shop', 'the', 'store',
  'transit', 'departure', 'arrival', 'hall', 'before', 'security',
]);

const NAME_JACCARD_THRESHOLD = 0.5;

// ── Helpers ─────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function normalizeName(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')       // diacritics
    .replace(/[^a-z0-9\s]/g, ' ')          // punctuation, ®, &
    .split(/\s+/)
    .filter(t => t && !NOISE_TOKENS.has(t) && !/^\d+$/.test(t));
}

function nameSimilarityPasses(rowName: string, candidateName: string): { pass: boolean; detail: string } {
  const a = normalizeName(rowName);
  const b = normalizeName(candidateName);
  if (a.length === 0 || b.length === 0) {
    // Name was all noise tokens (e.g. "T2 Food Gallery") — fall back to raw
    // substring check so we don't auto-pass on empty sets.
    const rawA = rowName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawB = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const pass = rawA.includes(rawB) || rawB.includes(rawA);
    return { pass, detail: `raw-substring=${pass}` };
  }
  const setA = new Set(a);
  const setB = new Set(b);
  const contained = a.every(t => setB.has(t)) || b.every(t => setA.has(t));
  const inter = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  const pass = contained || jaccard >= NAME_JACCARD_THRESHOLD;
  return { pass, detail: `jaccard=${jaccard.toFixed(2)} contained=${contained}` };
}

interface GateResult { pass: boolean; reason: string }

// All gates for one candidate against one row. Order matters only for the
// reported reason; a candidate must pass everything.
function validateCandidate(
  row: { name: string; terminal_code: string },
  cand: { id: string; displayName: string; formattedAddress: string },
): GateResult {
  if (PLACE_ID_DENYLIST.has(cand.id)) {
    return { pass: false, reason: 'denylist' };
  }
  if (PARENT_NAME_RE.test(cand.displayName.trim()) && !PARENT_NAME_RE.test(row.name.trim())) {
    return { pass: false, reason: 'parent_listing_name' };
  }

  const haystack = `${cand.displayName} ${cand.formattedAddress}`;
  const ownTokens = TERMINAL_TOKENS[row.terminal_code];
  if (!ownTokens) return { pass: false, reason: `unknown_terminal:${row.terminal_code}` };

  const ownMatch = ownTokens.some(re => re.test(haystack));
  const wrongTerminal = Object.entries(TERMINAL_TOKENS)
    .filter(([code]) => code !== row.terminal_code)
    .some(([, res]) => res.some(re => re.test(haystack)));

  // Cross-terminal veto: naming a DIFFERENT terminal without ours is a hard no.
  if (wrongTerminal && !ownMatch) return { pass: false, reason: 'wrong_terminal_token' };
  if (!ownMatch) return { pass: false, reason: 'no_terminal_token' };

  const sim = nameSimilarityPasses(row.name, cand.displayName);
  if (!sim.pass) return { pass: false, reason: `name_mismatch(${sim.detail})` };

  return { pass: true, reason: `ok(${sim.detail})` };
}

// ── Google Places API (v1) ──────────────────────────────────────────

interface Candidate { id: string; displayName: string; formattedAddress: string }

async function searchText(query: string): Promise<Candidate[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, pageSize: 5 }),
  });
  if (!res.ok) throw new Error(`searchText HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return (data.places ?? []).map((p: any) => ({
    id: p.id,
    displayName: p.displayName?.text ?? '',
    formattedAddress: p.formattedAddress ?? '',
  }));
}

async function placeDetails(placeId: string): Promise<Candidate | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`placeDetails HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const p = await res.json();
  return { id: p.id, displayName: p.displayName?.text ?? '', formattedAddress: p.formattedAddress ?? '' };
}

// ── Main ────────────────────────────────────────────────────────────

interface Decision {
  slug: string;
  terminal: string;
  rowName: string;
  decision: string;       // ASSIGNED | NO_MATCH | REJECTED:<reason> | VALID | GATE_FAIL:<reason> | ERROR
  candidateId?: string;
  candidateName?: string;
  candidateAddress?: string;
  gateLog: string[];
}

async function main() {
  const mode = VALIDATE_EXISTING ? 'validate-existing' : 'resolve-null';
  console.log(`Mode: ${mode}${DRY_RUN ? ' (DRY RUN — no writes)' : ' (LIVE)'}\n`);

  let query = supabase
    .from('amenity_detail')
    .select('id, amenity_slug, name, terminal_code, google_place_id')
    .eq('airport_code', 'SIN');

  query = VALIDATE_EXISTING
    ? query.not('google_place_id', 'is', null)
    : query.is('google_place_id', null);

  if (SLUGS) query = query.in('amenity_slug', SLUGS);
  if (LIMIT) query = query.limit(LIMIT);

  const { data: rows, error } = await query.order('amenity_slug');
  if (error) { console.error('Supabase query error:', error); process.exit(1); }
  if (!rows?.length) { console.log('No rows to process.'); return; }
  console.log(`${rows.length} row(s) to process.\n`);

  // Existing cross-terminal ownership map: place_id -> set of terminals using it.
  const { data: owned } = await supabase
    .from('amenity_detail')
    .select('google_place_id, terminal_code')
    .not('google_place_id', 'is', null);
  const ownership = new Map<string, Set<string>>();
  for (const o of owned ?? []) {
    if (!ownership.has(o.google_place_id)) ownership.set(o.google_place_id, new Set());
    ownership.get(o.google_place_id)!.add(o.terminal_code);
  }

  const decisions: Decision[] = [];
  let assigned = 0;

  for (const row of rows) {
    const d: Decision = {
      slug: row.amenity_slug, terminal: row.terminal_code, rowName: row.name,
      decision: 'NO_MATCH', gateLog: [],
    };
    try {
      if (VALIDATE_EXISTING) {
        // Regression mode: check the EXISTING id against the gates. Report
        // only — this mode never reassigns and never nulls.
        const cand = await placeDetails(row.google_place_id);
        if (!cand) {
          d.decision = 'GATE_FAIL:place_not_found';
        } else {
          d.candidateId = cand.id; d.candidateName = cand.displayName; d.candidateAddress = cand.formattedAddress;
          const g = validateCandidate(row, cand);
          d.gateLog.push(`${cand.id}: ${g.reason}`);
          d.decision = g.pass ? 'VALID' : `GATE_FAIL:${g.reason}`;
        }
      } else {
        const q = `${row.name} ${QUERY_SUFFIX[row.terminal_code] ?? 'Changi Airport'}`;
        const candidates = await searchText(q);
        let chosen: Candidate | null = null;
        for (const cand of candidates) {
          const g = validateCandidate(row, cand);
          d.gateLog.push(`${cand.id} "${cand.displayName}": ${g.reason}`);
          if (!g.pass) continue;
          // Cross-terminal uniqueness: reject if another terminal already
          // holds this id (DB state + assignments pending in this run).
          const holders = ownership.get(cand.id);
          if (holders && [...holders].some(t => t !== row.terminal_code)) {
            d.gateLog.push(`${cand.id}: cross_terminal_conflict(held by ${[...holders].join(',')})`);
            continue;
          }
          chosen = cand;
          break;
        }

        if (chosen) {
          d.candidateId = chosen.id; d.candidateName = chosen.displayName; d.candidateAddress = chosen.formattedAddress;
          if (DRY_RUN) {
            d.decision = 'ASSIGNED (dry)';
          } else {
            const { error: upErr } = await supabase
              .from('amenity_detail')
              .update({ google_place_id: chosen.id })
              .eq('id', row.id);
            d.decision = upErr ? `ERROR:${upErr.message}` : 'ASSIGNED';
          }
          if (!d.decision.startsWith('ERROR')) {
            assigned++;
            // Record in-run so a later row in another terminal can't take it.
            if (!ownership.has(chosen.id)) ownership.set(chosen.id, new Set());
            ownership.get(chosen.id)!.add(row.terminal_code);
          }
        } else {
          d.decision = candidates.length === 0 ? 'NO_MATCH(no results)' : 'NO_MATCH(all candidates rejected)';
        }
      }
    } catch (err) {
      d.decision = `ERROR:${err instanceof Error ? err.message : String(err)}`;
    }

    decisions.push(d);
    console.log(`[${d.decision}] ${d.slug} (${d.terminal}) "${d.rowName}"`
      + (d.candidateId ? ` → ${d.candidateId} "${d.candidateName}" @ ${d.candidateAddress}` : ''));
    await sleep(RATE_LIMIT_MS);
  }

  // ── Run report ────────────────────────────────────────────────────
  const needsManual = decisions.filter(x => x.decision.startsWith('NO_MATCH'));
  const lines = [
    `# Place ID resolve run — ${new Date().toISOString()}`,
    ``,
    `Mode: ${mode}${DRY_RUN ? ' (dry-run)' : ' (live)'} · rows: ${decisions.length} · assigned: ${assigned} · needs_manual: ${needsManual.length}`,
    ``,
    `| Slug | Terminal | Row name | Decision | Candidate | Candidate name | Address |`,
    `|---|---|---|---|---|---|---|`,
    ...decisions.map(x =>
      `| ${x.slug} | ${x.terminal} | ${x.rowName} | ${x.decision} | ${x.candidateId ?? '—'} | ${x.candidateName ?? '—'} | ${x.candidateAddress ?? '—'} |`),
    ``,
    `## Gate log`,
    ...decisions.flatMap(x => [``, `### ${x.slug}`, ...x.gateLog.map(g => `- ${g}`)]),
    ``,
    `## needs_manual_place_id`,
    ...(needsManual.length
      ? needsManual.map(x => `- ${x.slug} (${x.terminal}) "${x.rowName}" — ${x.decision}`)
      : ['(none)']),
    ``,
  ];
  writeFileSync(REPORT_PATH, lines.join('\n'));
  console.log(`\nDone. assigned=${assigned}, needs_manual=${needsManual.length}. Report: ${REPORT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });

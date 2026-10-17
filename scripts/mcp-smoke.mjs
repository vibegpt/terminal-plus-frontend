#!/usr/bin/env node
// MCP smoke test (CC-26 D). Exits 1 on the first failure, naming the step.
//
//   node scripts/mcp-smoke.mjs [url] [--no-flights]
//
// url defaults to https://terminalplus.app/api/mcp. --no-flights skips the two
// flight tools, which spend AeroDataBox units (the 30-min monitor runs them every
// 3 hours only). Every request sends x-tp-test: 1, so its rows land is_test.
// No dependencies: Node 18+ fetch.

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith('--')) || 'https://terminalplus.app/api/mcp';
const FLIGHTS = !args.includes('--no-flights');
const P95_LIMIT_MS = 5000;
const TOOL_NAMES = ['get_airport_context', 'get_recommendations', 'get_disruption_status', 'get_route'];
const FORBIDDEN_FIELDS = ['id', 'slug', 'amenity_slug', 'editorial_score', 'filters_applied', 'total_available', 'route_id', 'checked_at', 'current_local_time', 'time_budget_minutes'];

const timings = [];
let sessionId = null;
let nextId = 1;

class StepError extends Error {}
function fail(step, detail) { throw new StepError(`${step}: ${detail}`); }

async function post(step, body, { expectStatus = 200 } = {}) {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'x-tp-test': '1' };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(URL_ARG, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  } catch (err) {
    fail(step, `request failed (${err.name}: ${err.message})`);
  }
  timings.push({ step, ms: Date.now() - t0 });
  if (res.status !== expectStatus) fail(step, `HTTP ${res.status}, expected ${expectStatus}`);
  if (expectStatus === 202) return { res, json: null };
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { fail(step, `not JSON: ${text.slice(0, 120)}`); }
  if (json.error) fail(step, `JSON-RPC error ${json.error.code}: ${json.error.message}`);
  return { res, json };
}

function findForbidden(value, path = '$') {
  if (Array.isArray(value)) return value.flatMap((v, i) => findForbidden(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [
      ...(FORBIDDEN_FIELDS.includes(k) ? [`${path}.${k}`] : []),
      ...findForbidden(v, `${path}.${k}`),
    ]);
  }
  return [];
}

async function callTool(name, toolArgs, check) {
  const step = `tools/call ${name}`;
  const { json } = await post(step, { jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name, arguments: toolArgs } });
  const text = json.result?.content?.[0]?.text;
  if (typeof text !== 'string') fail(step, 'no text content');
  if (json.result.isError) fail(step, `isError: ${text.slice(0, 200)}`);
  const payload = JSON.parse(text);
  const leaked = findForbidden(payload);
  if (leaked.length) fail(step, `internal fields in output: ${leaked.slice(0, 5).join(', ')}`);
  check(payload, (detail) => fail(step, detail));
  console.log(`ok   ${step}`);
}

function isAmenityUrl(u) {
  return typeof u === 'string' && u.startsWith('https://terminalplus.app/amenity/') && u.includes('utm_source=mcp') && u.includes('utm_medium=agent');
}

async function main() {
  console.log(`MCP smoke against ${URL_ARG}${FLIGHTS ? '' : ' (no flight tools)'}`);

  // Transport
  {
    const step = 'GET (plain)';
    const res = await fetch(URL_ARG, { signal: AbortSignal.timeout(20000) }).catch((e) => fail(step, e.message));
    if (res.status !== 200) fail(step, `HTTP ${res.status}`);
    console.log(`ok   ${step}`);
  }
  {
    const step = 'GET (Accept: text/event-stream)';
    const res = await fetch(URL_ARG, { headers: { accept: 'text/event-stream' }, signal: AbortSignal.timeout(20000) }).catch((e) => fail(step, e.message));
    if (res.status !== 405) fail(step, `HTTP ${res.status}, expected 405`);
    console.log(`ok   ${step}`);
  }

  // Handshake
  {
    const { res, json } = await post('initialize', {
      jsonrpc: '2.0', id: nextId++, method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'tp-mcp-smoke', version: '1' } },
    });
    if (!json.result?.protocolVersion) fail('initialize', 'no protocolVersion');
    sessionId = res.headers.get('mcp-session-id');
    console.log(`ok   initialize (protocol ${json.result.protocolVersion}, session ${sessionId ? 'issued' : 'none'})`);
  }
  await post('notifications/initialized', { jsonrpc: '2.0', method: 'notifications/initialized' }, { expectStatus: 202 });
  console.log('ok   notifications/initialized (202)');
  {
    const { json } = await post('ping', { jsonrpc: '2.0', id: nextId++, method: 'ping' });
    if (!json.result || typeof json.result !== 'object') fail('ping', 'no result');
    console.log('ok   ping');
  }

  // Tools
  {
    const step = 'tools/list';
    const { json } = await post(step, { jsonrpc: '2.0', id: nextId++, method: 'tools/list' });
    const tools = json.result?.tools || [];
    const names = tools.map((t) => t.name).sort();
    if (JSON.stringify(names) !== JSON.stringify([...TOOL_NAMES].sort())) fail(step, `tools are [${names}]`);
    for (const t of tools) {
      if (!t.title && !t.annotations?.title) fail(step, `${t.name} has no title`);
      if (t.annotations?.readOnlyHint !== true) fail(step, `${t.name} readOnlyHint is not true`);
      if (t.annotations?.destructiveHint !== false) fail(step, `${t.name} destructiveHint is not false`);
      if (typeof t.annotations?.openWorldHint !== 'boolean') fail(step, `${t.name} has no openWorldHint`);
    }
    console.log(`ok   ${step} (4 tools, titles and annotations)`);
  }

  await callTool('get_recommendations', { terminal: 'SIN-T3', vibe: 'refuel', time_until_boarding_minutes: 120, limit: 5 }, (p, bad) => {
    if (!Array.isArray(p.recommendations) || p.recommendations.length === 0) bad('no recommendations');
    for (const r of p.recommendations) {
      if (!r.name || !r.terminal) bad('a recommendation lacks name or terminal');
      if (!isAmenityUrl(r.url)) bad(`bad url: ${r.url}`);
    }
  });

  await callTool('get_route', { arrival_terminal: 'SIN-T1', time_budget_minutes: 240 }, (p, bad) => {
    if (!Array.isArray(p.stops) || p.stops.length === 0) bad(`no stops (${p.message || p.route_type})`);
    if (!p.stops.some((s) => isAmenityUrl(s.url))) bad('no stop has a venue url');
  });

  if (FLIGHTS) {
    await callTool('get_airport_context', { flight_number: 'SQ322' }, (p, bad) => {
      if (p.error === 'flight_data_unavailable') bad('flight data unavailable');
      if (p.error !== 'flight_not_found' && (p.airport !== 'SIN' || !p.status)) bad('missing airport or status');
    });
    await callTool('get_disruption_status', { flight_number: 'SQ322' }, (p, bad) => {
      if (typeof p.status !== 'string') bad('no status');
      if (/unavailable/i.test(p.message || '')) bad('flight data unavailable');
      if (!Array.isArray(p.suggested_actions) && p.status !== 'unknown') bad('no suggested_actions');
    });
  }

  const sorted = timings.map((t) => t.ms).sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)];
  const slowest = timings.reduce((a, b) => (b.ms > a.ms ? b : a));
  console.log(`p95 ${p95} ms over ${timings.length} requests (slowest: ${slowest.step}, ${slowest.ms} ms)`);
  if (p95 > P95_LIMIT_MS) fail('latency', `p95 ${p95} ms over ${P95_LIMIT_MS} ms`);
  console.log('PASS');
}

main().catch((err) => {
  console.error(`FAIL ${err instanceof StepError ? err.message : `unexpected: ${err?.stack || err}`}`);
  process.exit(1);
});

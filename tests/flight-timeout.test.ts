// AeroDataBox timeout (CC-26b, MCP monitor red #22). Run: npx tsx --test tests/flight-timeout.test.ts
// fetch is mocked: a stalled upstream never answers until its AbortSignal fires. Real
// timers, so the stall cases take ~8 s each; they prove the real budgets.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

let flightStatus: typeof import('../api/flight-status');
let mcp: typeof import('../api/mcp');
const realFetch = globalThis.fetch;

type Upstream = (url: string, init?: RequestInit) => Promise<Response>;
let upstream: Upstream = () => Promise.reject(new Error('no mock'));
const telemetryRows: any[] = [];

before(async () => {
  process.env.AERODATABOX_API_KEY = 'test-key';
  process.env.SUPABASE_URL = 'https://supabase.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  delete process.env.VERCEL_URL; // mcp.ts then calls http://localhost:3000/api/flight-status
  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith('https://supabase.test/')) {
      if (init?.method === 'POST' && url.includes('agent_interactions')) {
        telemetryRows.push(JSON.parse(String(init.body)));
      }
      return new Response(null, { status: 201 });
    }
    return upstream(url, init);
  }) as typeof fetch;
  flightStatus = await import('../api/flight-status');
  mcp = await import('../api/mcp');
});
after(() => { globalThis.fetch = realFetch; });

/** Answers only when aborted, like a stalled TCP connection. */
const stalled: Upstream = (_url, init) =>
  new Promise((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
  });

function mockRes() {
  const r: any = { statusCode: 200, headers: {} as Record<string, string>, body: undefined };
  r.setHeader = (k: string, v: string) => { r.headers[k.toLowerCase()] = v; return r; };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

async function callTool(name: string, args: Record<string, unknown>) {
  const req: any = {
    method: 'POST',
    headers: { 'x-tp-test': '1', 'mcp-session-id': 'test-timeout' },
    body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } },
  };
  const res = mockRes();
  const t0 = Date.now();
  await mcp.default(req, res);
  return { ms: Date.now() - t0, res, payload: JSON.parse(res.body.result.content[0].text) };
}

test('flight-status: a stalled AeroDataBox call answers 504 at the 8 s timeout', async () => {
  upstream = stalled;
  const res = mockRes();
  const t0 = Date.now();
  await flightStatus.default({ query: { number: 'SQ322', date: '2026-10-20' } } as any, res);
  const ms = Date.now() - t0;
  assert.equal(res.statusCode, 504);
  assert.deepEqual(res.body, { error: 'API request failed' });
  assert.equal(res.headers['x-tp-adb-calls'], '1');
  assert.ok(ms >= flightStatus.ADB_TIMEOUT_MS - 50 && ms < flightStatus.ADB_TIMEOUT_MS + 1000, `took ${ms} ms`);
});

test('flight-status: a stalled response body also times out', async () => {
  upstream = (_url, init) => Promise.resolve(new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('['));
      init?.signal?.addEventListener('abort', () => controller.error(init.signal!.reason), { once: true });
    },
  }), { status: 200 }));
  const res = mockRes();
  await flightStatus.default({ query: { number: 'SQ323', date: '2026-10-20' } } as any, res);
  assert.equal(res.statusCode, 504);
});

test('flight-status: an upstream 5xx passes through', async () => {
  upstream = () => Promise.resolve(new Response('busy', { status: 503 }));
  const res = mockRes();
  await flightStatus.default({ query: { number: 'SQ324', date: '2026-10-20' } } as any, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers['x-tp-adb-calls'], '1');
});

test('flight-status: the preview stall flight is inert outside preview', async () => {
  delete process.env.VERCEL_ENV;
  let called = 0;
  upstream = () => { called++; return Promise.resolve(new Response(null, { status: 204 })); };
  const res = mockRes();
  await flightStatus.default({ query: { number: 'TP0STALL', date: '2026-10-20' } } as any, res);
  assert.equal(called, 1);
  assert.equal(res.statusCode, 404);
});

test('MCP get_airport_context: stalled flight lookup answers in budget, upstream_error logged', async () => {
  upstream = stalled; // mcp.ts -> /api/flight-status never answers
  telemetryRows.length = 0;
  const { ms, res, payload } = await callTool('get_airport_context', { flight_number: 'SQ322' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.error, undefined);
  assert.ok(ms < 10_000, `took ${ms} ms`);
  assert.equal(payload.error, 'flight_data_unavailable');
  assert.match(payload.message, /unavailable right now/);
  assert.equal(telemetryRows.length, 1);
  assert.equal(telemetryRows[0].zero_reason, 'upstream_error');
  assert.equal(telemetryRows[0].is_test, true);
});

test('MCP get_disruption_status: flight-status 504 answers gracefully, upstream_error logged', async () => {
  upstream = () => Promise.resolve(new Response('{"error":"API request failed"}', { status: 504 }));
  telemetryRows.length = 0;
  const { res, payload } = await callTool('get_disruption_status', { flight_number: 'SQ322' });
  assert.equal(res.body.error, undefined);
  assert.equal(payload.status, 'unknown');
  assert.match(payload.message, /unavailable right now/);
  assert.equal(telemetryRows[0].zero_reason, 'upstream_error');
});

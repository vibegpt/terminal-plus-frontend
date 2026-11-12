// tasks/cc-29/harness.cjs · CC-29 repro and acceptance for A1 (Home) and A2 (flight polling).
// Usage: node tasks/cc-29/harness.cjs http://localhost:4173   (a `vite preview` of the build under test)
// Writes nothing anywhere: telemetry, journey and chat calls are answered locally, Supabase reads get []
// after 250 ms (about one sin1 -> Frankfurt round trip), /api/flight-status is stubbed per scenario.
// Needs `require("playwright")` to resolve. If it does not: npm i --no-save playwright@1 && npx playwright install chromium
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4173';
const MIN = 60_000;

function journey(now) {
  return {
    currentTerminal: 'SIN-T3', departingFlight: 'SQ322', departureTerminal: 'SIN-T3',
    boardingTime: new Date(now + 180 * MIN).toISOString(), scheduledDeparture: new Date(now + 210 * MIN).toISOString(),
    walkMinutes: 0, usableWindowMinutes: 170, jewelViable: false, capturedAt: new Date(now).toISOString(),
    schema_version: 4, journey_type: 'departing', flight_source: 'board', gate: 'A1',
  };
}
const flight = extra => JSON.stringify({ flightNumber: 'SQ322', status: 'Scheduled', gate: 'A1', scheduledTime: null,
  revisedTime: null, estimatedBoardingTime: null, destination: 'LHR', ...extra });

async function open(browser, now, flightHandler) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(j => {
    localStorage.setItem('tp_test', '1');
    localStorage.setItem('tp_journey_context', JSON.stringify(j));
    sessionStorage.setItem('tp_onboarded', '1');
  }, journey(now));
  const page = await ctx.newPage();
  await page.route(/\/api\/(events|journey|chat)/, r => r.fulfill({ status: 204, body: '' }));
  await page.route(/supabase\.co\//, r => r.request().url().includes('/auth/')
    ? r.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    : new Promise(res => setTimeout(res, 250)).then(() => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })));
  await page.route(/\/api\/flight-status/, flightHandler);
  const collections = [];
  page.on('request', q => { if (/rest\/v1\/collections\?/.test(q.url())) collections.push(q.url()); });
  await page.clock.install({ time: now });
  await page.goto(`${BASE}/?tp_test=1`, { waitUntil: 'networkidle' });
  return { ctx, page, collections };
}

(async () => {
  const browser = await chromium.launch();
  const now = Date.now();
  const out = {};

  // A1: Home with a journey 3 h out. Requests to collections and skeleton blocks per simulated minute.
  {
    const ok = r => r.fulfill({ status: 200, contentType: 'application/json', body: flight({}) });
    const { ctx, page, collections: hits } = await open(browser, now, ok);
    await page.waitForTimeout(3000);
    const atLoad = hits.length;
    const ticks = [];
    for (let m = 1; m <= 3; m++) {
      const before = hits.length;
      await page.clock.runFor(MIN);
      await page.waitForTimeout(300);
      const skeleton = await page.locator('.animate-pulse').count();
      await page.waitForTimeout(2500);
      ticks.push({ minute: m, newRequests: hits.length - before, skeletonBlocks: skeleton });
    }
    out.A1_home = { collectionsRequestsAtLoad: atLoad, ticks };
    await ctx.close();
  }

  // A2a: the flight is cancelled. Calls and CANCELLED toasts over 60 simulated seconds.
  {
    let calls = 0;
    const cancelled = r => { calls++; r.fulfill({ status: 200, contentType: 'application/json', body: flight({ status: 'Cancelled' }) }); };
    const { ctx, page } = await open(browser, now, cancelled);
    const toastsShown = new Set();
    for (let s = 10; s <= 60; s += 10) {
      await page.clock.runFor(10_000);
      await page.waitForTimeout(400);
      if (await page.getByText(/CANCELLED/).count()) toastsShown.add(s);
    }
    out.A2_cancelled = { flightStatusCallsIn60s: calls, secondsWithToastVisible: [...toastsShown] };
    await ctx.close();
  }

  // A2b: gate assigned (B5), later changed (B7). Expected cadence for boarding 3 h out: 5 s, then every 30 min.
  {
    const calls = [];
    const gates = r => { calls.push(Date.now()); r.fulfill({ status: 200, contentType: 'application/json',
      body: flight({ gate: calls.length === 1 ? 'B5' : 'B7' }) }); };
    const { ctx, page } = await open(browser, now, gates);
    const at = [];
    for (const step of [10_000, 20_000, 30 * MIN]) {
      await page.clock.runFor(step);
      await page.waitForTimeout(400);
      at.push(calls.length);
    }
    out.A2_gate = { callsAfter10s: at[0], callsAfter30s: at[1], callsAfter30m30s: at[2] };
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error(e); process.exit(1); });

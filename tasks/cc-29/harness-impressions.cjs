// tasks/cc-29/harness-impressions.cjs · CC-29 AC-1 add-on: real collection rows, impression events across 3 ticks.
// Usage: node tasks/cc-29/harness-impressions.cjs http://localhost:4173
// Same stubs as harness.cjs (writes nothing), but Supabase `collections` answers one row per requested slug
// with 3 venues, so cards get counts and sort for real. Counts recommendation_impression events in the
// stubbed /api/events bodies and records the visible "N spots" labels before and after each tick.
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4173';
const MIN = 60_000;
const journey = now => ({
  currentTerminal: 'SIN-T3', departingFlight: 'SQ322', departureTerminal: 'SIN-T3',
  boardingTime: new Date(now + 180 * MIN).toISOString(), scheduledDeparture: new Date(now + 210 * MIN).toISOString(),
  walkMinutes: 0, usableWindowMinutes: 170, jewelViable: false, capturedAt: new Date(now).toISOString(),
  schema_version: 4, journey_type: 'departing', flight_source: 'board', gate: 'A1',
});
(async () => {
  const browser = await chromium.launch();
  const now = Date.now();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(j => {
    localStorage.setItem('tp_test', '1');
    localStorage.setItem('tp_journey_context', JSON.stringify(j));
    sessionStorage.setItem('tp_onboarded', '1');
  }, journey(now));
  const page = await ctx.newPage();
  const impressionBodies = [];
  await page.route(/\/api\/(events|journey|chat)/, r => {
    const b = r.request().postData() || '';
    const n = (b.match(/recommendation_impression/g) || []).length;
    if (n) impressionBodies.push(n);
    r.fulfill({ status: 204, body: '' });
  });
  await page.route(/\/api\/flight-status/, r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ flightNumber: 'SQ322', status: 'Scheduled', gate: 'A1', scheduledTime: null, revisedTime: null, estimatedBoardingTime: null, destination: 'LHR' }) }));
  const reqs = [];
  await page.route(/supabase\.co\//, r => {
    const u = r.request().url();
    if (u.includes('/auth/')) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    const m = decodeURIComponent(u).match(/rest\/v1\/collections\?.*collection_id=in\.\(([^)]*)\)/);
    if (m) {
      reqs.push(u);
      const slugs = m[1].split(',').map(s => s.replace(/"/g, ''));
      const h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const rows = slugs.map(s => ({ collection_id: s, name: s, hero_image_url: null,
        collection_amenities: [0, 1, 2].map(k => ({ amenity_detail: { name: `${s}-${k}`, is_landside: false, opening_hours: null } })).slice(0, 1 + (h(s) % 3)) }));
      return new Promise(res => setTimeout(res, 250)).then(() => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }));
    }
    return new Promise(res => setTimeout(res, 250)).then(() => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  });
  await page.clock.install({ time: now });
  await page.goto(`${BASE}/?tp_test=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.clock.runFor(15_000); await page.waitForTimeout(1500);
  const spots = () => page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^\d+ spots?$/.test(e.textContent.trim())).map(e => e.textContent.trim()).join('|'));
  const atLoad = { requests: reqs.length, impressionEvents: impressionBodies.reduce((a, b) => a + b, 0), spots: await spots() };
  const ticks = [];
  for (let m = 1; m <= 3; m++) {
    const r0 = reqs.length, i0 = impressionBodies.reduce((a, b) => a + b, 0), s0 = await spots();
    await page.clock.runFor(MIN);
    await page.waitForTimeout(300);
    const skeleton = await page.locator('.animate-pulse').count();
    await page.clock.runFor(10_000);
    await page.waitForTimeout(2500);
    ticks.push({ minute: m, newRequests: reqs.length - r0, skeletonBlocks: skeleton,
      newImpressionEvents: impressionBodies.reduce((a, b) => a + b, 0) - i0, spotsUnchanged: s0 === await spots() });
  }
  console.log(JSON.stringify({ atLoad: { ...atLoad, spots: undefined, spotsList: atLoad.spots }, ticks }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

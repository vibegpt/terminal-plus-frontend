// tasks/cc-29/harness-slot.cjs · CC-29 AC-3: the device clock crosses the 12:00 time-slot boundary (morning -> afternoon).
// Usage: node tasks/cc-29/harness-slot.cjs http://localhost:4173 [screenshot-prefix]
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
  const now = Date.UTC(2026, 10, 12, 3, 57, 0) + Number(process.env.OFFSET_MIN || 0) * MIN; // 11:57 SGT, OFFSET_MIN shifts it
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, timezoneId: 'Asia/Singapore' });
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
  const shot = process.argv[3];
  const names = () => page.evaluate(() => [...document.querySelectorAll('.animate-pulse')].length ? ['SKELETON'] : [...document.querySelectorAll('h3,h2,p')].map(e => e.textContent.trim()).filter(Boolean));
  const slugsOf = urls => [...new Set(urls.flatMap(u => (decodeURIComponent(u).match(/collection_id=in\.\(([^)]*)\)/) || [, ''])[1].split(',').map(x => x.replace(/"/g, ''))))].sort();
  const before = { requests: reqs.length, slugs: slugsOf(reqs), cards: await names() };
  if (shot) await page.screenshot({ path: `${shot}-before.png` });
  await page.clock.runFor(MIN);           // 11:58
  await page.clock.runFor(MIN);           // 11:59
  const r1 = reqs.length;
  await page.clock.runFor(MIN);           // 12:00 -> afternoon
  await page.waitForTimeout(300);
  const skeletonDuring = await page.locator('.animate-pulse').count();
  await page.clock.runFor(10_000);
  await page.waitForTimeout(2500);
  const after = { requests: reqs.length, newRequests: reqs.length - r1, skeletonBlocksAtBoundary: skeletonDuring, cards: await names() };
  const newUrls = reqs.slice(r1);
  const newSlugs = slugsOf(newUrls);
  after.newSlugSetDiffers = JSON.stringify(newSlugs) !== JSON.stringify(before.slugs);
  const shown = after.cards.filter(c => newSlugs.includes(c));
  after.cardsFromNewSlot = shown.length;
  after.cardsFromOldOnly = after.cards.filter(c => before.slugs.includes(c) && !newSlugs.includes(c)).length;
  after.scrolledRows = await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 5 && e.scrollLeft > 0).map(e => Math.round(e.scrollLeft)));
  if (shot) await page.screenshot({ path: `${shot}-after.png` });
  console.log(JSON.stringify({ before: { requests: before.requests, slugCount: before.slugs.length, cardCount: before.cards.length }, after: { ...after, cards: undefined, cardCount: after.cards.length, firstCards: after.cards.filter(c => /^[a-z0-9-]+$/.test(c)).slice(0, 14).join(',') }, newSlugCount: newSlugs.length }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

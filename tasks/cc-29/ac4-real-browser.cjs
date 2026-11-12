// tasks/cc-29/ac4-real-browser.cjs · CC-29 AC-4: real timers, real network (reads only), 375 px, ?tp_test=1.
// Usage: node tasks/cc-29/ac4-real-browser.cjs <base-url> <screenshot-dir>
// A journey boarding 3 h out is seeded; Home stays open ~3 min 20 s. Logs collections requests, flight-status calls and
// every skeleton appearance (MutationObserver on .animate-pulse). Writes go out with tp_test (rows land is_test).
const { chromium } = require('playwright');
const BASE = process.argv[2], DIR = process.argv[3] || '.';
const MIN = 60_000;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const now = Date.now();
  await ctx.addInitScript(j => {
    localStorage.setItem('tp_test', '1');
    if (!localStorage.getItem('tp_journey_context')) localStorage.setItem('tp_journey_context', JSON.stringify(j));
    sessionStorage.setItem('tp_onboarded', '1');
    window.__skel = [];
    window.__firstCards = null;
    new MutationObserver(() => {
      const n = document.querySelectorAll('.animate-pulse').length;
      const spots = [...document.querySelectorAll('*')].some(e => e.children.length === 0 && /^\d+ spots?$/.test(e.textContent.trim()));
      if (spots && window.__firstCards === null) window.__firstCards = Math.round(performance.now());
      // The page skeleton is the header block below; other .animate-pulse nodes are lazy-image placeholders.
      const page = document.querySelectorAll('.h-6.w-28.animate-pulse').length;
      if (page) window.__skel.push([Math.round(performance.now()), page]);
    }).observe(document, { childList: true, subtree: true });
  }, { currentTerminal: 'SIN-T3', departingFlight: 'SQ322', departureTerminal: 'SIN-T3',
       boardingTime: new Date(now + 180 * MIN).toISOString(), scheduledDeparture: new Date(now + 210 * MIN).toISOString(),
       walkMinutes: 0, usableWindowMinutes: 170, jewelViable: false, capturedAt: new Date(now).toISOString(),
       schema_version: 4, journey_type: 'departing', flight_source: 'board', gate: 'A1' });
  const p = await ctx.newPage();
  const coll = [], fs = [];
  p.on('request', q => { const u = q.url(); const t = Math.round((Date.now() - now) / 1000);
    if (/rest\/v1\/collections\?/.test(u)) coll.push(t); if (/\/api\/flight-status/.test(u)) fs.push(t); });
  await p.goto(`${BASE}/?tp_test=1`, { waitUntil: 'networkidle' });
  const t0 = Date.now();
  const spots = () => p.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^\d+ spots?$/.test(e.textContent.trim())).length);
  const afterLoad = { collections: coll.length, spotsLabels: await spots(), skeletonSeen: await p.evaluate(() => window.__skel.length) };
  await p.screenshot({ path: `${DIR}/ac4-t0.png` });
  await p.waitForTimeout(3 * MIN + 20_000);
  const minutesShown = await p.evaluate(() => document.body.innerText.match(/\d+h \d+m to board|\dh to board/)?.[0]);
  await p.screenshot({ path: `${DIR}/ac4-t3min.png` });
  const skelAfterLoad = await p.evaluate(() => window.__skel.filter(([t]) => window.__firstCards !== null && t > window.__firstCards));
  console.log(JSON.stringify({ openedForSeconds: Math.round((Date.now() - t0) / 1000), afterLoad, collectionsRequestsTotal: coll.length, collectionsRequestTimes: coll,
    flightStatusCalls: fs, spotsLabelsNow: await spots(), countdownShown: minutesShown, pageSkeletonObservationsAfterFirstCards: skelAfterLoad.length, firstCardsAtMs: await p.evaluate(() => window.__firstCards) }));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

// src/lib/telemetry.ts
// Batching telemetry client for /api/events.
//
// - Buffers events in memory; flushes at 20 queued, 10s elapsed, or page
//   hide/unload (sendBeacon, fetch-keepalive fallback). Airport wifi drops
//   requests — per-event POSTs are not acceptable.
// - Never throws into app code: every entry point is wrapped, errors are
//   silent no-ops (DEV-gated debug logs only).
// - anon_id reuses the localStorage key from the old eventLogger stub.
// - session_id is a UUID (the endpoint rejects non-UUID ids), rotated after
//   30min of inactivity; a session_start event fires once per session_id.

// ── Contract (mirror of api/events.ts — keep in sync) ──────────────

const EVENT_TYPES = new Set([
  'session_start',
  'vibe_selected',
  'recommendation_impression',
  'amenity_tapped',
  'amenity_detail_dwell',
  'route_started',
  'stop_completed',
  'stop_skipped',
  'search_performed',
  'tool_called',
  'flight_not_found',
]);

export type EventType =
  | 'session_start'
  | 'vibe_selected'
  | 'recommendation_impression'
  | 'amenity_tapped'
  | 'amenity_detail_dwell'
  | 'route_started'
  | 'stop_completed'
  | 'stop_skipped'
  | 'search_performed'
  | 'tool_called'
  | 'flight_not_found';

export interface TrackFields {
  terminal_code?: string | null;
  vibe?: string | null;
  amenity_slug?: string | null;
  position?: number | null;
  minutes_to_boarding?: number | null;
  route_id?: string | null;
  payload?: Record<string, unknown>;
}

interface EventRow extends Required<TrackFields> {
  anon_id: string;
  session_id: string;
  surface: 'app';
  event_type: EventType;
}

// ── Config ──────────────────────────────────────────────────────────

const ENDPOINT = '/api/events';
const FLUSH_AT = 20;           // queued events that trigger a flush
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUE = 100;         // beyond this, drop oldest
const MAX_BATCH = 50;          // endpoint hard limit per POST
const SESSION_IDLE_MS = 30 * 60 * 1000;
const DWELL_MIN_MS = 500;
const DWELL_MAX_MS = 10 * 60 * 1000;

const ANON_KEY = 'anon_id';    // pre-existing key from the old eventLogger stub
const SESSION_KEY = 'tp_session_id';
const ACTIVITY_KEY = 'tp_session_last_activity';
const STARTED_KEY = 'tp_session_started_for';

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function devLog(...args: unknown[]) {
  if (DEV) console.log('[telemetry]', ...args);
}

// ── Identity ────────────────────────────────────────────────────────

function getAnonId(): string {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

// Returns the current session_id, minting a new one on first use or after
// 30min of inactivity. Minting fires session_start (once per session_id).
function ensureSession(): string {
  const now = Date.now();
  let sid = sessionStorage.getItem(SESSION_KEY);
  const lastActivity = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0);

  if (!sid || now - lastActivity > SESSION_IDLE_MS) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  sessionStorage.setItem(ACTIVITY_KEY, String(now));

  if (sessionStorage.getItem(STARTED_KEY) !== sid) {
    sessionStorage.setItem(STARTED_KEY, sid);
    enqueue(buildRow('session_start', {}, sid));
  }
  return sid;
}

// ── Context enrichment ──────────────────────────────────────────────

function getTerminalCode(): string | null {
  return sessionStorage.getItem('tp_user_terminal') || null;
}

// Exact minutes from the journey context's boarding time (the sessionStorage
// flight mirror is only re-synced every 60s, so compute from source).
function getMinutesToBoarding(): number | null {
  try {
    const raw = localStorage.getItem('tp_journey_context');
    if (!raw) return null;
    const boardingTime = (JSON.parse(raw) as { boardingTime?: string }).boardingTime;
    if (!boardingTime) return null;
    const mins = Math.floor((new Date(boardingTime).getTime() - Date.now()) / 60000);
    return Number.isFinite(mins) ? Math.max(0, mins) : null;
  } catch {
    return null;
  }
}

function buildRow(eventType: EventType, fields: TrackFields, sessionId: string): EventRow {
  return {
    anon_id: getAnonId(),
    session_id: sessionId,
    surface: 'app',
    event_type: eventType,
    terminal_code: fields.terminal_code ?? getTerminalCode(),
    vibe: fields.vibe ?? null,
    amenity_slug: fields.amenity_slug ?? null,
    position: fields.position ?? null,
    minutes_to_boarding: fields.minutes_to_boarding ?? getMinutesToBoarding(),
    route_id: fields.route_id ?? null,
    payload: fields.payload ?? {},
  };
}

// ── Queue + flush ───────────────────────────────────────────────────

interface QueuedEvent {
  row: EventRow;
  retried: boolean;
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let unloading = false;

function enqueue(row: EventRow) {
  queue.push({ row, retried: false });
  if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
  devLog('queued', row.event_type, `(${queue.length} pending)`);

  // Page is going away (or backgrounded): our pagehide listener registered at
  // module load, so it runs BEFORE component listeners that enqueue events
  // like dwell — flush those immediately or they'd die with the tab.
  if (unloading || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
    flushBeacon();
    return;
  }

  if (queue.length >= FLUSH_AT) {
    void flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, FLUSH_INTERVAL_MS);
  }
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(batch.length);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch.map(q => q.row) }),
      keepalive: true,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    devLog('flushed', batch.length, 'events');
  } catch (err) {
    // Re-queue once; events that already retried are dropped.
    const retryable = batch.filter(q => !q.retried);
    retryable.forEach(q => { q.retried = true; });
    queue = [...retryable, ...queue].slice(-MAX_QUEUE);
    devLog('flush failed, re-queued', retryable.length, err);
    if (queue.length > 0 && !flushTimer) {
      flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, FLUSH_INTERVAL_MS);
    }
  } finally {
    flushing = false;
  }
  if (queue.length >= FLUSH_AT) void flush();
}

// Unload path: sendBeacon survives tab close; fetch-keepalive as fallback.
function flushBeacon() {
  if (queue.length === 0) return;
  const batch = queue.slice(0, MAX_BATCH);
  const body = JSON.stringify({ events: batch.map(q => q.row) });

  let sent = false;
  if (typeof navigator.sendBeacon === 'function') {
    sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
  }
  if (!sent) {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
  queue = queue.slice(batch.length);
  devLog('beacon flush', batch.length, 'events');
}

if (typeof window !== 'undefined') {
  try {
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.visibilityState === 'hidden') flushBeacon();
      } catch { /* telemetry must never throw */ }
    });
    window.addEventListener('pagehide', () => {
      try {
        unloading = true;
        flushBeacon();
      } catch { /* telemetry must never throw */ }
    });
    // Restored from bfcache — page is live again
    window.addEventListener('pageshow', () => { unloading = false; });
  } catch { /* non-browser environment */ }
}

// ── Public API ──────────────────────────────────────────────────────

// Ensure identity exists and session_start is recorded. Call once at app mount.
export function init(): void {
  try {
    ensureSession();
  } catch (err) {
    devLog('init error', err);
  }
}

export function track(eventType: EventType, fields: TrackFields = {}): void {
  try {
    if (!EVENT_TYPES.has(eventType)) {
      if (DEV) console.warn(`[telemetry] unknown event_type "${eventType}" — dropped`);
      return;
    }
    const sid = ensureSession();
    enqueue(buildRow(eventType, fields, sid));
  } catch (err) {
    devLog('track error', err);
  }
}

// Impression dedup: memoized on content, not on render. A re-render with an
// identical ordered slug list fires nothing; new order or new slugs fire again.
const seenImpressions = new Set<string>();

export function trackImpressionOnce(fields: {
  vibe: string | null;
  slugs: string[];
  collection?: string;
  terminal_code?: string | null;
}): void {
  try {
    if (!fields.slugs.length) return;
    const sid = ensureSession();
    const key = `${sid}|${fields.vibe ?? ''}|${fields.collection ?? ''}|${fields.slugs.join(',')}`;
    if (seenImpressions.has(key)) return;
    seenImpressions.add(key);
    track('recommendation_impression', {
      vibe: fields.vibe,
      terminal_code: fields.terminal_code,
      payload: fields.collection
        ? { slugs: fields.slugs, collection: fields.collection }
        : { slugs: fields.slugs },
    });
  } catch (err) {
    devLog('impression error', err);
  }
}

// Dwell: clamp at 10min, discard sub-500ms bounces.
export function trackDwell(amenitySlug: string, vibe: string | null, ms: number): void {
  try {
    if (!Number.isFinite(ms) || ms < DWELL_MIN_MS) return;
    track('amenity_detail_dwell', {
      amenity_slug: amenitySlug,
      vibe,
      payload: { ms: Math.min(Math.round(ms), DWELL_MAX_MS) },
    });
  } catch (err) {
    devLog('dwell error', err);
  }
}

// src/lib/lastSeen.ts
// Gap detection for the outcome strip (CC-13).
//
// iOS evicts backgrounded tabs, so the cold boot is the common resume path and the
// gap has to live in localStorage. tp_last_seen (epoch ms) is written:
// - on visibilitychange -> hidden (the backgrounding time),
// - every 30 s while visible,
// - on pagehide only while visible (a reload or navigation). A pagehide while hidden
//   is an eviction or a kill, and must keep the backgrounding time.
//
// A resume is this page load, or visibilitychange -> visible. Each one snapshots
// tp_last_seen and the candidate BEFORE anything writes them. This module runs at
// import, ahead of React: a cold boot that restores /amenity/X would otherwise
// re-record X with at = now and fail rule 4 on the most common path.
// A page that loads hidden is evaluated on its first visible, against the
// snapshot taken at load.

import type { Candidate } from './outcomePrompt';
import { parseDebugFlag } from './outcomePrompt';
import { readCandidate } from './candidateTap';

export interface ResumeSnapshot {
  id: number;
  kind: 'boot' | 'visible';
  /** The resume moment (epoch ms). */
  at: number;
  /** tp_last_seen before this resume. Null = first-ever page load. */
  lastSeen: number | null;
  candidate: Candidate | null;
}

const LAST_SEEN_KEY = 'tp_last_seen';
const DEBUG_KEY = 'tp_gap_debug';
const HEARTBEAT_MS = 30_000;

const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const DEBUG_BUILD = !!env?.DEV || env?.VITE_TP_DEBUG === '1';

let seq = 0;
let latest: ResumeSnapshot | null = null;
let deferredBoot: ResumeSnapshot | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(s: ResumeSnapshot) => void>();

/** Console diagnostics on DEV and VITE_TP_DEBUG=1 builds only. */
export function outcomeDebugLog(...args: unknown[]): void {
  if (DEBUG_BUILD) console.info('[outcome]', ...args);
}

/** True when ?tp_gap_debug=1 was seen this tab on a debug build. */
export function isGapDebug(): boolean {
  try {
    return sessionStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

function readLastSeen(): number | null {
  try {
    const n = Number(localStorage.getItem(LAST_SEEN_KEY));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeLastSeen(): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch { /* storage blocked: no gap, no prompt */ }
}

function startHeartbeat(): void {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    if (document.visibilityState === 'visible') writeLastSeen();
  }, HEARTBEAT_MS);
}

function stopHeartbeat(): void {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}

function snapshot(kind: ResumeSnapshot['kind']): ResumeSnapshot {
  return { id: ++seq, kind, at: Date.now(), lastSeen: readLastSeen(), candidate: readCandidate() };
}

function emit(s: ResumeSnapshot): void {
  latest = s;
  outcomeDebugLog('resume', s.kind, { lastSeen: s.lastSeen, candidate: s.candidate?.slug ?? null });
  listeners.forEach(cb => {
    try { cb(s); } catch { /* a listener must never break the tracker */ }
  });
}

/** The most recent resume, for a listener that mounts after it fired. */
export function latestResume(): ResumeSnapshot | null {
  return latest;
}

export function subscribeResume(cb: (s: ResumeSnapshot) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function install(): void {
  try {
    if (parseDebugFlag(window.location.search, !!env?.DEV, env?.VITE_TP_DEBUG)) {
      sessionStorage.setItem(DEBUG_KEY, '1');
    }
  } catch { /* storage blocked */ }

  const boot = snapshot('boot');
  if (document.visibilityState === 'visible') {
    emit(boot);
    writeLastSeen();
    startHeartbeat();
  } else {
    deferredBoot = boot;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      writeLastSeen();
      stopHeartbeat();
      return;
    }
    const s = deferredBoot ? { ...deferredBoot, id: ++seq, at: Date.now() } : snapshot('visible');
    deferredBoot = null;
    emit(s);
    writeLastSeen();
    startHeartbeat();
  });

  window.addEventListener('pagehide', () => {
    if (document.visibilityState === 'visible') writeLastSeen();
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try { install(); } catch { /* the tracker must never break the app */ }
}

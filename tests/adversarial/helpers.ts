// tests/adversarial/helpers.ts
// Shared setup for the adversarial suite: .env.local loader (same manual
// pattern as api/chat.ts — no dotenv dependency) + a Supabase client
// factory. Tests use the ANON key so the suite is structurally read-only
// and exercises the same privileges as the real UI.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function loadEnvLocal(): void {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      let val = trimmed.slice(eqIdx + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env.local absent (CI) — env vars must come from the environment */ }
}

let _anon: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient {
  if (!_anon) {
    loadEnvLocal();
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
    }
    _anon = createClient(url, key);
  }
  return _anon;
}

// Full AgentContext with everything nulled — tests override what they probe.
export function ctx(overrides: Partial<{
  terminal: string | null;
  gate: string | null;
  boardingTime: string | null;
  flightNumber: string | null;
  destination: string | null;
  selectedVibe: string | null;
}> = {}) {
  return {
    terminal: null,
    gate: null,
    boardingTime: null,
    flightNumber: null,
    destination: null,
    selectedVibe: null,
    ...overrides,
  };
}

export function isNonIncreasing(scores: Array<number | null>): boolean {
  for (let i = 1; i < scores.length; i++) {
    const prev = scores[i - 1] ?? 0;
    const cur = scores[i] ?? 0;
    if (cur > prev) return false;
  }
  return true;
}

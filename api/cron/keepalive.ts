// api/cron/keepalive.ts
// Daily Vercel cron (vercel.json, 03:17 UTC). Reads 1 catalogue row so the
// Supabase Free project sees activity and doesn't pause after 7 quiet days.
// A bridge until real traffic or a paid plan; delete it then. Writes nothing.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null
function getServiceClient() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    _supabase = createClient(url, key)
  }
  return _supabase
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // Vercel cron sends `Authorization: Bearer $CRON_SECRET`. With no secret set,
  // nothing can match (never compare against "Bearer undefined").
  const secret = process.env.CRON_SECRET
  if (!secret) console.error('[keepalive] CRON_SECRET not configured')
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    console.error('[keepalive] Supabase env vars not configured')
    return res.status(503).json({ ok: false, error: 'Supabase not configured' })
  }

  const t0 = Date.now()
  const { error } = await supabase.from('amenity_detail').select('amenity_slug').limit(1)
  const ms = Date.now() - t0
  if (error) {
    console.error('[keepalive] query failed', error.message)
    return res.status(503).json({ ok: false, error: error.message })
  }
  return res.status(200).json({ ok: true, ms })
}

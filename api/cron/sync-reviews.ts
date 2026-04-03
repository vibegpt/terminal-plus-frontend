import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------- Load .env.local for vercel dev ----------
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let val = trimmed.slice(eqIdx + 1)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* not found in production — fine */ }

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(204).end()

  // Auth: Vercel cron sends this header automatically; manual calls use Bearer token
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured' })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch amenities with place IDs that need review data
  const { data: amenities, error } = await supabase
    .from('amenity_detail')
    .select('id, amenity_slug, name, google_place_id')
    .eq('airport_code', 'SIN')
    .not('google_place_id', 'is', null)

  if (error || !amenities) {
    return res.status(500).json({ error: 'Failed to fetch amenities', detail: error })
  }

  let updated = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  // Process in batches of 10 with delay to respect Google rate limits
  const BATCH_SIZE = 10
  const DELAY_MS = 1100

  for (let i = 0; i < amenities.length; i += BATCH_SIZE) {
    const batch = amenities.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(async (amenity) => {
        try {
          // Google Places API (New) — Place Details
          const url = `https://places.googleapis.com/v1/places/${amenity.google_place_id}`
          const response = await fetch(url, {
            headers: {
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
            },
          })

          if (!response.ok) {
            const text = await response.text()
            throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`)
          }

          const data = await response.json()

          // No review data available for this place
          if (!data.rating && !data.reviews) {
            skipped++
            return true
          }

          // Extract best review highlight (4+ stars, longest text)
          let reviewHighlight: string | null = null
          if (data.reviews && data.reviews.length > 0) {
            const bestReview = data.reviews
              .filter((r: any) => r.rating >= 4 && r.text?.text)
              .sort((a: any, b: any) => (b.text?.text?.length || 0) - (a.text?.text?.length || 0))[0]

            if (bestReview?.text?.text) {
              reviewHighlight = bestReview.text.text.substring(0, 200)
            }
          }

          // Update Supabase
          const { error: updateError } = await supabase
            .from('amenity_detail')
            .update({
              google_rating: data.rating || null,
              google_review_count: data.userRatingCount || null,
              review_highlight: reviewHighlight,
              review_data_updated_at: new Date().toISOString(),
            })
            .eq('id', amenity.id)

          if (updateError) throw updateError
          updated++
          return true
        } catch (err: any) {
          errors.push(`${amenity.name}: ${err.message}`)
          failed++
          return false
        }
      })
    )

    // Rate limit delay between batches
    if (i + BATCH_SIZE < amenities.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  return res.status(200).json({
    success: true,
    total: amenities.length,
    updated,
    skipped,
    failed,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
  })
}

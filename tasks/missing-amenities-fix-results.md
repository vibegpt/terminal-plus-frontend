# Missing Amenities Fix Results — 2026-04-03

**Commit:** `eab1a4b` — fix: order amenity queries by editorial_score DESC
**Deployment:** `terminal-plus-frontend-6qw65bwoz-todds-projects-d0181971.vercel.app`

---

## Root Cause

`queryAmenities` in `api/chat.ts` had no ORDER BY — Supabase returned rows by insertion order. With 89 T1 amenities and a LIMIT of 40, attractions like Cactus Garden appeared at position 33, buried among 4 LOTTE Duty Free shops, 3 Guardian pharmacies, and fashion stores. Claude saw a wall of low-value amenities and recommended accordingly.

## Fix Applied

Added `.order('editorial_score', { ascending: false, nullsFirst: false })` to both query paths:
- `api/chat.ts` inline `queryAmenities` (production handler)
- `api/lib/agent.ts` shared `queryAmenities` (MCP reuse path)

High editorial_score amenities (attractions, signature restaurants) now surface first in the 40-row window.

---

## Test: T1 Attractions (120 min)

**Status:** PASS

**Response:** Recommended Cactus Garden, Rain Vortex, Fish Spa, Shiseido Forest Valley, Butterfly Garden — all attractions with editorial personality (specific details like "100 cactus species", "7 storeys", "free with Priority Pass").

**Criteria:**
- Mentions Cactus Garden: PASS
- Mentions other attractions: PASS (Rain Vortex, Fish Spa, Forest Valley, Butterfly Garden)
- Editorial personality: PASS
- Attractions not buried under food: PASS — all 5 recommended amenities are attractions

---

## Test: T3 Attractions (120 min)

**Status:** PASS

**Response:** Recommended SilverKris Lounge, Butterfly Garden ("1,000 butterflies across 40 species"), Entertainment Deck. Balanced mix of lounge + attraction + entertainment.

**Criteria:**
- Mentions Butterfly Garden: PASS
- Mentions food option: PASS (SilverKris Lounge has laksa bar)
- Balanced mix: PASS (lounge + attraction + entertainment)
- Editorial personality: PASS

---

## Summary

Both queries now surface high-value attractions first. No limit changes needed — ordering alone solved the problem by ensuring the 40-row window captures the best amenities instead of whatever was inserted first.

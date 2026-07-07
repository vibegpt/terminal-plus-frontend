# Google Place ID Contamination Audit — Report

Date: 2026-07-07 · Project bpbyhdjdezynyiclqezy · Data-only (zero code edits)
Commit: `fix(data): clear contaminated google place ids` (not pushed)

## Headline

Of **360 rows with a synced Google rating, 187 (52%) were borrowed** — one place's reviews copied onto the wrong amenity via a shared `google_place_id`. Cleared them; **193 rows nulled** total (187 rated + 6 that carried only a bogus place_id). Zero cross-terminal contamination remains.

## Mechanism (verified)

The reviews sync attached one Place ID per brand/name without terminal disambiguation. Within **every** shared-id cluster all rows carried an **identical** rating + review_count + highlight + sync date — proof of a uniform copy from one source place. So at most one row per cluster legitimately owns the id; the `review_highlight` text names the true place/terminal and was the owner signal.

## Audit: 68 shared-id clusters, 245 rows

Severity examples:
- **`ChIJw3l-FL4X2jERw2pScvHQCbg` — 97,417 reviews** (the Changi Airport *overall* listing, "one of the most impressive airports…") smeared across **15 unrelated Jewel/misc shops** (Singapore Mint, TRS Tax Refund, Kinokuniya, Kélé, Awfully Chocolate, Crane, SunnyHills…).
- **SilverKris** `ChIJmSWWF4082jERIWnmIGTljBQ` — highlight says "SilverKris Lounge at **T3**", but the rows are **T1 + T4**; real owner (T3) has no row → both borrowed (6,434 reviews each).
- **Butterfly Garden** `ChIJs91Di4w…` — 13,288 reviews spread onto Memory of Lived Space + Birds in Flight + T1/T2/T4 gardens.
- **`dnata Lounge`** cluster's reviews are actually about **marhaba Lounge** (different brand) → all 3 nulled.
- Manulife Sky Nets / Foggy Bowls / Canopy Park mixed across 4 terminals; Din Tai Fung / Paradise Dynasty / Muji / Koi Pond / Mirror Maze / Zara / Spa Express etc. — one listing per brand copied to every terminal.

## Classification & outcome

| Bucket | Clusters | Rows | Treatment |
|---|---|---|---|
| Contaminated → **NULL** (5 review cols cleared) | 42 | **193** | wrong-terminal borrows, owner-absent, brand-mismatch, generic-highlight (no verifiable owner) |
| **KEEP** — verified owners (highlight names matching terminal+brand) | — | 25 | 12 owners + 13 Lotte-T1 rows |
| **LEAVE** — legit same-terminal multi-shop chain dupes | 12 | 27 | WH Smith ×4, Guardian ×4, Garrett, TWG-T4, Travelex-T2, Tod's — genuine shared listings; deduping is out of scope |

Rows retaining data: 52. Rows nulled: 193 (matches applied UPDATE count).

### Verified owners kept (spot-checked intact)
Butterfly Garden T3 (4.6 / 13,288), Rain Vortex Jewel (4.8 / 2,039), SATS Premier T3, Song Fa Jewel, Sunflower Garden T2, Cactus Garden T1 (×2 dupe), Shiseido Forest Valley Jewel, Zara Jewel, Hermès T3, iStudio T3 (4.1 / 265, kept over Apple Store), Petalclouds T4, Lotte Duty Free T1 (13 rows).

### Two flagged decisions (both resolved to default via approval)
- **Big Lotte T3 (13×T3+4×T4) and T2 (12×T2+2×T4) clusters** → NULL all (no highlight verified owner; 132/74 reviews). They're on the re-source list.
- **Chain multi-shop dupes** (27 rows) → LEFT as-is (legitimate shared listings; dedupe out of scope).

## Verification (Always Works™)

- ✅ **Applied UPDATE reported 193 rows** — matches the plan exactly.
- ✅ **Re-query of shared-id clusters**: 14 remain, **all single-terminal** (dterm=1) — zero cross-terminal contamination. They are exactly the documented KEEP (Lotte-T1, Cactus-Garden-T1) + LEAVE (12 chain-dupe clusters) groups.
- ✅ **Spot-checks**: SilverKris T1 & T4 → both null; Butterfly Garden T3 owner unchanged, T1/T2/T4 + Birds in Flight + Memory of Lived Space → null; iStudio kept vs Apple Store null; Rain Vortex Jewel kept; Din Tai Fung T1 null.
- ✅ **No KEEP/LEAVE row lost a rating** (owners intact; only borrowed data cleared).
- ✅ `npm run build` + `npm run test:adversarial` 10/10 (no code touched).
- ✅ `git status`: only `supabase/seeds/place_id_contamination_fix_20260706.sql` + this report added.

## Manual re-source list (needs correct per-terminal place_ids later)

The nulled rows re-populate automatically **only once the sync fetches a correct, terminal-specific place_id** (the current sync will re-contaminate — see root cause). Brands needing correct IDs, by affected terminals (top of list):

- **Lotte Duty Free W&S** — T2, T3, T4 (31 rows)
- **Din Tai Fung** — Jewel, T1–T4 · **Paradise Dynasty** — T1–T4 · **Muji** — Jewel/T1/T2/T3 · **Koi Pond** — T1–T4 · **Mirror Maze** — Jewel/T1/T2/T4 · **Spa Express** — Jewel/T1/T3/T4 · **UOB Currency Exchange** — Jewel/T1/T3/T4 · **Eu Yan Sang** — Jewel/T1/T2/T3 · **Canopy Park** — Jewel/T2/T3/T4 · **TRS Tax Refund** — Jewel/T1/T2/T3
- **Zara, Sunflower Garden, Butterfly Garden, Cactus Garden, Song Fa, Uniqlo, Sushi Tei, YOTELAIR, Koi Thé, Kinokuniya, Changi Experience Studio, dnata Lounge, Travelex, Foggy Bowls, Manulife Sky Nets, Entertainment Deck** — 3 terminals each
- **2-terminal**: SilverKris (T1,T4), Cathay Pacific (T2,T3), Aerotel (T2,T3), Ambassador Transit Hotel, Ya Kun, Fragrance Bak Kwa, IRVINS, Longchamp, Tory Burch, Kaboom, LEGO, Victoria's Secret, Electronics Sprint-Cass, SATS(T4), Rain Vortex(T1,T2)
- **Jewel/misc singles** (the 97k garbage cluster): Singapore Mint, TRS, Faculty, Crane, SunnyHills, Awfully Chocolate, Kélé, Kinokuniya(Jewel), Rhythm of Nature, Social Tree, The Little Dröm Store, Telecommunications Kiosk, Weekend Sundries, Manulife Sky Nets, Jewel Waterfall Viewpoint, Bynd Artisan, Pew Pew Patches, plus Apple Store, Times Travel, Steel In Bloom, A&W, Kopitiam(T1), Coming Home, Tiffany, Hermès(T1), Shiseido(T1), Kering Eyewear, T2 Food Gallery, Vessel, Spirit of Man.

(Full grouped list queried live; a couple of never-synced rows such as a stray SYD-T2 Gucci also surface as place_id-null and can be ignored.)

## Sync root cause (flagged, NOT fixed — out of scope)

The sync matched by brand/name and took one Place ID for the brand, applying it to every terminal row; for obscure shops it fell back to the airport's own listing (the 97k-review case). **Fix belongs in the sync**: query Places with terminal/location context and reject a candidate whose returned address or terminal doesn't match the row before writing. Until then, re-running the sync will re-contaminate these rows.

## Artifacts
- `supabase/seeds/place_id_contamination_fix_20260706.sql` — the single idempotent UPDATE (explicit KEEP + LEAVE allowlists), re-run-safe.

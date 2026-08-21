# Scorer Fix — Pre-Fix Baseline (both scorers, 3 pairs)

Captured 2026-07-10 22:50 SGT, before any change, via the investigation's comparison script
(replicates `api/mcp.ts handleGetRecommendations` query+scorer verbatim; imports the real
`src/utils/smart7Select` for the UI path with VibePage's exact query). Read-only run.

**The UI ranked lists below are the fixed reference — they must be UNCHANGED post-fix.**
The MCP lists are the pre-fix behavior the fix is expected to replace.

Summary:

| Pair | Rows matching vibe | MCP pool | UI pool | Pool ∩ | Top-3 overlap | Top-7 overlap | Spearman ρ |
|------|-------------------|----------|---------|--------|---------------|---------------|------------|
| refuel × SIN-T1 | 44 | 21 (unordered LIMIT) | 44 | 21 | 0/3 | 0/7 | 0.292 (n=14) |
| chill × SIN-T3 | 39 | 21 (unordered LIMIT) | 39 | 21 | 1/3 | 3/7 | 0.314 (n=6) |
| shop × SIN-JEWEL | 178 | 21 (unordered LIMIT) | 50 | 6 | 1/3 | 4/7 | 0.371 (n=6) |

Full raw output:

```
Run time (local): 2026-07-10T14:50:29.939Z | SGT: 10/07/2026, 10:50:29 pm

================ refuel × SIN-T1 ================
DB rows matching vibe ilike '%refuel%': 44
MCP candidate pool: 21 rows (query limit 21, NO order-by)
UI  candidate pool: 44 rows (query limit 50, editorial_score DESC)
Pool intersection: 21
UI ranked list after name-dedup: 36

MCP full ranked list (rank. slug _score editorial terminal):
   1. starbucks-sint1  _score=110 editorial=11 SIN-T1
   2. coffee-bean-tea-leaf-sint1  _score=110 editorial=10 SIN-T1
   3. sin-t1-crystal-jade-1757008220.066062  _score=110 editorial=13 SIN-T1
   4. sin-t1-toast-box-1757008220.066062  _score=110 editorial=13 SIN-T1
   5. heavenly-wang-sint1  _score=105 editorial=10 SIN-T1
   6. sin-t1-ya-kun-1757008220.066062  _score=105 editorial=10 SIN-T1
   7. aw-root-beer-t3  _score=95 editorial=13 SIN-T3
   8. ya-kun-kaya-toast-t4-new  _score=90 editorial=10 SIN-T4
   9. starbucks-sint2  _score=90 editorial=11 SIN-T2
  10. starbucks-sint4  _score=90 editorial=11 SIN-T4
  11. mcdonalds-t2-transit  _score=90 editorial=10 SIN-T2
  12. coffee-bean-tea-leaf-sint3  _score=90 editorial=10 SIN-T3
  13. heavenly-wang-sint2  _score=90 editorial=12 SIN-T2
  14. starbucks-sint3  _score=90 editorial=11 SIN-T3
  15. ya-kun-kaya-toast-t3-new  _score=90 editorial=10 SIN-T3
  16. mcdonalds-t2-arrival  _score=85 editorial=10 SIN-T2
  17. mcdonalds-t3-arrival  _score=85 editorial=10 SIN-T3
  18. a-w-restaurants  _score=70 editorial=12 SIN-JEWEL
  19. birds-of-paradise-jewel  _score=70 editorial=13 SIN-JEWEL
  20. leckerbaer-jewel  _score=70 editorial=13 SIN-JEWEL
  21. mcdonalds-jewel  _score=65 editorial=10 SIN-JEWEL

UI full ranked list (rank. slug editorial terminal):
   1. sin-t1-kopitiam-1757008220.066062  editorial=14 SIN-T1
   2. sin-t2-food-court-1757008220.066062  editorial=14 SIN-T2
   3. fossa-chocolate-jewel  editorial=14 SIN-JEWEL
   4. grain-traders-jewel  editorial=14 SIN-JEWEL
   5. kele-jewel  editorial=14 SIN-JEWEL
   6. wang-cafe-jewel  editorial=14 SIN-JEWEL
   7. twg-tea-t4-new  editorial=14 SIN-T4
   8. sin-t1-crystal-jade-1757008220.066062  editorial=13 SIN-T1
   9. sin-t1-toast-box-1757008220.066062  editorial=13 SIN-T1
  10. aw-root-beer-t3  editorial=13 SIN-T3
  11. bacha-coffee-sint3  editorial=13 SIN-T3
  12. kenangan-coffee-sint2  editorial=13 SIN-T2
  13. awfully-chocolate-jewel  editorial=13 SIN-JEWEL
  14. birds-of-paradise-jewel  editorial=13 SIN-JEWEL
  15. champion-bolo-bun-jewel  editorial=13 SIN-JEWEL
  16. creamier-jewel  editorial=13 SIN-JEWEL
  17. leckerbaer-jewel  editorial=13 SIN-JEWEL
  18. mr-coconut-jewel  editorial=13 SIN-JEWEL
  19. starbucks-reserve-sinjewel  editorial=13 SIN-JEWEL
  20. sunny-hill-jewel  editorial=13 SIN-JEWEL
  21. chagee-sint2  editorial=12 SIN-T2
  22. a-w-restaurants  editorial=12 SIN-JEWEL
  23. sin-t1-burger-king-1757008220.066062  editorial=11 SIN-T1
  24. starbucks-sint1  editorial=11 SIN-T1
  25. ocoffee-club-sint3  editorial=11 SIN-T3
  26. sin-t1-andes-1757008220.066062  editorial=10 SIN-T1
  27. heavenly-wang-sint1  editorial=10 SIN-T1
  28. sin-t1-subway-1757008220.066062  editorial=10 SIN-T1
  29. coffee-bean-tea-leaf-sint1  editorial=10 SIN-T1
  30. sin-t1-ya-kun-1757008220.066062  editorial=10 SIN-T1
  31. mcdonalds-t3-arrival  editorial=10 SIN-T3
  32. hudsons-coffee-sint2  editorial=10 SIN-T2
  33. mcdonalds-t2-arrival  editorial=10 SIN-T2
  34. mcdonalds-t2-transit  editorial=10 SIN-T2
  35. sin-t2-peach-garden-1757008220.066062  editorial=10 SIN-T2
  36. mcdonalds-jewel  editorial=10 SIN-JEWEL

Top-3 overlap: 0/3 []
Top-7 overlap: 0/7 []
Spearman rho over 14 shared slugs: 0.292
SAME-POOL diagnostic (intersection of 21): top-3 overlap 1/3, rho=0.292

================ chill × SIN-T3 ================
DB rows matching vibe ilike '%chill%': 39
MCP candidate pool: 21 rows (query limit 21, NO order-by)
UI  candidate pool: 39 rows (query limit 50, editorial_score DESC)
Pool intersection: 21
UI ranked list after name-dedup: 16

MCP full ranked list (rank. slug _score editorial terminal):
   1. spa-express-t3-new  _score=115 editorial=12 SIN-T3
   2. butterfly-garden-t3-new  _score=115 editorial=14 SIN-T3
   3. canopy-park-t3-new  _score=110 editorial=11 SIN-T3
   4. spa-express-t1-new  _score=95 editorial=12 SIN-T1
   5. dnata-lounge-t1-new  _score=95 editorial=13 SIN-T1
   6. ambassador-transit-hotel-t1-new  _score=95 editorial=13 SIN-T1
   7. singapore-airlines-silverkris-lounge-t4-new  _score=95 editorial=13 SIN-T4
   8. dnata-lounge-t2-new  _score=95 editorial=13 SIN-T2
   9. singapore-airlines-silverkris-lounge-t2-new  _score=95 editorial=14 SIN-T2
  10. sats-premier-lounge-t1-new  _score=95 editorial=12 SIN-T1
  11. singapore-airlines-silverkris-lounge-t1-new  _score=95 editorial=14 SIN-T1
  12. enchanted-garden-t2  _score=90 editorial=11 SIN-T2
  13. canopy-park-t4-new  _score=90 editorial=11 SIN-T4
  14. canopy-park-t2-new  _score=90 editorial=11 SIN-T2
  15. cactus-garden-t1-new  _score=90 editorial=11 SIN-T1
  16. butterfly-garden-t2-new  _score=90 editorial=11 SIN-T2
  17. butterfly-garden-t4-new  _score=90 editorial=11 SIN-T4
  18. butterfly-garden-t1-new  _score=90 editorial=11 SIN-T1
  19. cactus-garden-t4-new  _score=90 editorial=11 SIN-T4
  20. sats-premier-lounge-t4-new  _score=90 editorial=11 SIN-T4
  21. canopy-park-jewel-new  _score=70 editorial=11 SIN-JEWEL

UI full ranked list (rank. slug editorial terminal):
   1. butterfly-garden-t3-new  editorial=14 SIN-T3
   2. singapore-airlines-silverkris-lounge-t1-new  editorial=14 SIN-T1
   3. ambassador-transit-hotel-t1-new  editorial=13 SIN-T1
   4. cactus-garden-t3-new  editorial=12 SIN-T3
   5. spa-express-t3-new  editorial=12 SIN-T3
   6. sunflower-garden-t3-new  editorial=12 SIN-T3
   7. cactus-garden-t1  editorial=12 SIN-T1
   8. snooze-lounge-t1  editorial=12 SIN-T1
   9. canopy-park-t3-new  editorial=11 SIN-T3
  10. cathay-pacific-lounge-t3-new  editorial=11 SIN-T3
  11. movie-theatre-t3  editorial=11 SIN-T3
  12. sats-premier-lounge-t3-new  editorial=11 SIN-T3
  13. enchanted-garden-t2  editorial=11 SIN-T2
  14. orchid-garden-t2  editorial=11 SIN-T2
  15. plaza-premium-lounge-t4-new  editorial=11 SIN-T4
  16. dnata-lounge-t3-new  editorial=10 SIN-T3

Top-3 overlap: 1/3 ["butterfly-garden-t3-new"]
Top-7 overlap: 3/7 ["spa-express-t3-new","butterfly-garden-t3-new","ambassador-transit-hotel-t1-new"]
Spearman rho over 6 shared slugs: 0.314
SAME-POOL diagnostic (intersection of 21): top-3 overlap 1/3, rho=0.314

================ shop × SIN-JEWEL ================
DB rows matching vibe ilike '%shop%': 178
MCP candidate pool: 21 rows (query limit 21, NO order-by)
UI  candidate pool: 50 rows (query limit 50, editorial_score DESC)
Pool intersection: 6
UI ranked list after name-dedup: 35

MCP full ranked list (rank. slug _score editorial terminal):
   1. lego-airport-store  _score=95 editorial=13 SIN-T4
   2. twg-tea-boutique-t3  _score=95 editorial=13 SIN-T4
   3. irvins-salted-egg-t1  _score=95 editorial=13 SIN-T1
   4. guardian-health-beauty-level-2-shop-16-sint1  _score=95 editorial=12 SIN-T1
   5. montblanc  _score=95 editorial=12 SIN-T3
   6. taste-singapore  _score=95 editorial=13 SIN-T4
   7. victorias-secret-beauty-accessories-sint1  _score=90 editorial=10 SIN-T1
   8. lotte-duty-free-wines-spirits-t1-level-1-23  _score=90 editorial=11 SIN-T1
   9. victorias-secret-beauty-accessories-t2  _score=90 editorial=10 SIN-T2
  10. wh-smith-level-2-shop-41-sint1  _score=90 editorial=10 SIN-T1
  11. zakkasg  _score=90 editorial=11 SIN-T4
  12. swarovski-t1  _score=90 editorial=10 SIN-T1
  13. rituals  _score=90 editorial=11 SIN-T3
  14. the-fashion-place  _score=90 editorial=10 SIN-T4
  15. lululemon  _score=90 editorial=11 SIN-T1
  16. wh-smith-level-2-shop-7-sint3  _score=90 editorial=10 SIN-T3
  17. unity  _score=90 editorial=11 SIN-T2
  18. wh-smith-level-2-shop-67-sint1  _score=90 editorial=10 SIN-T1
  19. sunglass-hut-t2  _score=90 editorial=11 SIN-T2
  20. whsmith-t1-level-1-84  _score=85 editorial=11 SIN-T1
  21. the-digital-gadgets-t4  _score=85 editorial=10 SIN-T4

UI full ranked list (rank. slug editorial terminal):
   1. apple-store  editorial=13 SIN-T3
   2. fragrance-bak-kwa-t3  editorial=13 SIN-T3
   3. irvins-salted-egg-t1  editorial=13 SIN-T1
   4. lego-airport-store  editorial=13 SIN-T4
   5. taste-singapore  editorial=13 SIN-T4
   6. twg-tea-boutique-t3  editorial=13 SIN-T4
   7. bynd-artisan-jewel  editorial=12 SIN-JEWEL
   8. ong-shunmugam-jewel  editorial=12 SIN-JEWEL
   9. the-little-drom-store-jewel  editorial=12 SIN-JEWEL
  10. eu-yan-sang-sint3  editorial=12 SIN-T3
  11. guardian-health-beauty-sin-t3-basement-24  editorial=12 SIN-T3
  12. guardian-health-beauty-before-security-basement-shop-24-sint3  editorial=12 SIN-T3
  13. guardian-health-beauty-level-2-shop-29-sint3  editorial=12 SIN-T3
  14. guardian-health-beauty-level-2-shop-66-sint3  editorial=12 SIN-T3
  15. montblanc  editorial=12 SIN-T3
  16. watches-of-switzerland  editorial=12 SIN-T3
  17. garrett-popcorn-t1  editorial=12 SIN-T1
  18. guardian-health-beauty-level-2-shop-16-sint1  editorial=12 SIN-T1
  19. guardian-health-beauty-level-2-shop-69-sint1  editorial=12 SIN-T1
  20. lindt  editorial=12 SIN-T1
  21. longchamp-t1  editorial=12 SIN-T1
  22. louis-vuitton-t1  editorial=12 SIN-T1
  23. guardian-health-beauty-before-security-level-2-shop-13-sint2  editorial=12 SIN-T2
  24. guardian-health-beauty-level-2-shop-155-sint2  editorial=12 SIN-T2
  25. tumi  editorial=12 SIN-T2
  26. beyond-the-vines-jewel  editorial=11 SIN-JEWEL
  27. furla-sinjewel  editorial=11 SIN-JEWEL
  28. charles-keith  editorial=11 SIN-T3
  29. coach  editorial=11 SIN-T3
  30. gucci-t3  editorial=11 SIN-T3
  31. hermes-t3  editorial=11 SIN-T3
  32. lego-airport-store-sint3  editorial=11 SIN-T3
  33. garrett-popcorn-shops-sint1  editorial=11 SIN-T1
  34. gassan-watches-t1  editorial=11 SIN-T1
  35. kering-eyewear-lagardere  editorial=11 SIN-T2

Top-3 overlap: 1/3 ["irvins-salted-egg-t1"]
Top-7 overlap: 4/7 ["lego-airport-store","twg-tea-boutique-t3","irvins-salted-egg-t1","taste-singapore"]
Spearman rho over 6 shared slugs: 0.371
SAME-POOL diagnostic (intersection of 6): top-3 overlap 2/3, rho=0.371

MCP pool determinism (refuel, two consecutive runs): identical this time (not guaranteed — no ORDER BY)
```

## Planning-phase addendum: pool-size simulation (drove the VIBE_POOL=50 decision)

Ranking top-21 vs top-50 of the *ordered* pool through the identical `smart7Select`:

```
refuel × SIN-T1: pool50=44 → order-identical top-7: true
chill × SIN-T3: pool50=39 → order-identical top-7: false
  ui7 : butterfly-garden-t3-new, singapore-airlines-silverkris-lounge-t1-new, ambassador-transit-hotel-t1-new, cactus-garden-t3-new, spa-express-t3-new, sunflower-garden-t3-new, cactus-garden-t1
  mcp7: butterfly-garden-t3-new, singapore-airlines-silverkris-lounge-t1-new, ambassador-transit-hotel-t1-new, dnata-lounge-t1-new, cathay-pacific-lounge-t2-new, cactus-garden-t3-new, spa-express-t3-new
shop × SIN-JEWEL: pool50=50 → order-identical top-7: false
  ui7 : apple-store, fragrance-bak-kwa-t3, irvins-salted-egg-t1, lego-airport-store, taste-singapore, twg-tea-boutique-t3, bynd-artisan-jewel
  mcp7: apple-store, fragrance-bak-kwa-t3, irvins-salted-egg-t1, gucci-t2, lego-airport-store, taste-singapore, twg-tea-boutique-t3
```

Conclusion: any pool cap smaller than the UI's breaks name-dedup parity → agent pool cap must equal VibePage's 50 (`DISPLAY.VIBE_POOL`).

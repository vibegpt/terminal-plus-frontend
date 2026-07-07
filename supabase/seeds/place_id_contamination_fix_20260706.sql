-- Google Place ID contamination cleanup
-- Applied 2026-07-07 (project bpbyhdjdezynyiclqezy).
--
-- The reviews sync attached one google_place_id per brand/name without
-- terminal disambiguation, so one place's rating/reviews/highlight were
-- copied onto every row sharing that id (68 shared-id clusters, 245 rows).
-- Within each cluster all rows carry identical review data — proof of a
-- uniform copy. This clears the borrowed data on contaminated rows so the
-- next sync can attach the correct per-row place_id. Clearing review fields
-- is not data loss — it removes false data.
--
-- Nulls all 5 review columns (google_place_id, google_rating,
-- google_review_count, review_highlight, review_data_updated_at) on every
-- shared-cluster row EXCEPT:
--   • KEEP: 12 verified owners + 13 Lotte-T1 owner rows (highlight verifies
--     terminal+brand) — see keep_slug below.
--   • LEAVE: same-terminal same-brand multi-shop chain duplicates
--     (WH Smith ×4, Guardian ×4, Garrett, TWG-T4, Travelex-T2, Tod's) —
--     legitimate shared listings; deduping is a separate concern.
--
-- Idempotent: re-running nulls nothing new (KEEP/LEAVE rows are untouched,
-- and once a contaminated row's place_id is cleared it leaves the shared set).
-- Expected: 193 rows updated (187 of which had a borrowed rating).

update amenity_detail a set
  google_place_id       = null,
  google_rating         = null,
  google_review_count   = null,
  review_highlight      = null,
  review_data_updated_at = null
where a.google_place_id in (
    -- shared-id clusters (id used by >1 row)
    select google_place_id from amenity_detail
    where google_place_id is not null
    group by google_place_id having count(*) > 1
  )
  -- LEAVE: legitimate same-terminal multi-shop chain duplicate clusters
  and a.google_place_id not in (
    'ChIJXWDMZCU92jERezLxFBTnFz4', -- Garrett Popcorn (T1)
    'ChIJaxs0QUY92jERWqrWS87Y_eg', -- TWG Tea (T4)
    'ChIJV8XBQ8A82jERVqtyfdTbfn8', -- WH Smith (T3)
    'ChIJeajrCwY92jERPYvQOEDClwg', -- WH Smith (T1)
    'ChIJDSpop7g82jERVtYSv1phSH0', -- WH Smith (T4)
    'ChIJW98Qtso92jERBFEHL7Yx8O0', -- WH Smith (T2)
    'ChIJI-FRrH492jERoDlgMSZk3I0', -- Guardian (T1)
    'ChIJcykdpo482jER4RI0bkCN1Zw', -- Guardian (T2)
    'ChIJ3_SMPE4X2jERvoBhI7FgOQ0', -- Guardian (T3)
    'ChIJTWv9wZob2jER3vCgkpJ-rRg', -- Guardian (T3)
    'ChIJHVpvxqc92jERgVUZMPeuMiE', -- Travelex (T2)
    'ChIJJ6xcPYw82jER3pMR8OH112M'  -- Tod's (T2)
  )
  -- KEEP: verified owners (highlight names matching terminal + brand)
  and a.amenity_slug not in (
    'butterfly-garden-t3-new',
    'sats-premier-lounge-t3-new',
    'rain-vortex-jewel-new',
    'song-fa-bak-kut-teh-jewel-new',
    'sunflower-garden-t2-new',
    'cactus-garden-t1',
    'cactus-garden-t1-new',
    'shiseido-forest-valley-jewel-new',
    'zara-jewel-new',
    'hermes-t3',
    'istudio',
    'petalclouds',
    -- Lotte Duty Free T1 cluster (highlight "Terminal 1"): keep 13 T1 rows,
    -- the lone T4 row in this cluster is NOT listed here and will be nulled.
    'lotte-duty-free-t1-new',
    'lotte-duty-free-wines-spirits-t1-level-1-10',
    'lotte-duty-free-wines-spirits-t1-level-1-23',
    'lotte-duty-free-wines-spirits-t1-level-2-22',
    'lotte-duty-free-wines-spirits-t1-level-2-46',
    'lotte-duty-free-wines-spirits-t1-level-2-53',
    'lotte-duty-free-wines-spirits-t1-level-2-68',
    'lotte-duty-free-wines-spirits-level-1-shop-10-sint1',
    'lotte-duty-free-wines-spirits-level-1-shop-23-sint1',
    'lotte-duty-free-wines-spirits-level-2-shop-22-sint1',
    'lotte-duty-free-wines-spirits-level-2-shop-46-sint1',
    'lotte-duty-free-wines-spirits-level-2-shop-53-sint1',
    'lotte-duty-free-wines-spirits-level-2-shop-68-sint1'
  );

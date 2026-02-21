-- SQL Migration: Update all "Explore" vibe tags to "discover" (lowercase)
-- Run this in your Supabase SQL Editor
-- Created: 2025-10-05
-- Updated: Fixed to use lowercase 'discover' (constraint requirement)

-- ============================================================
-- IMPORTANT: Database constraint requires lowercase vibe values
-- Valid values: 'chill', 'refuel', 'comfort', 'discover', 'quick', 'work', 'shop'
-- ============================================================

-- ============================================================
-- STEP 1: Check current state (optional - for verification)
-- ============================================================
SELECT
  terminal_code,
  COUNT(*) as amenity_count
FROM amenity_detail
WHERE vibe_tags LIKE '%Explore%' OR vibe_tags LIKE '%explore%'
GROUP BY terminal_code;


-- ============================================================
-- STEP 2: Update amenity_detail.vibe_tags field
-- ============================================================

-- Replace "Explore" (capitalized) with "discover" (lowercase)
UPDATE amenity_detail
SET vibe_tags = REPLACE(vibe_tags, 'Explore', 'discover')
WHERE vibe_tags LIKE '%Explore%';

-- Replace "explore" (already lowercase) with "discover"
UPDATE amenity_detail
SET vibe_tags = REPLACE(vibe_tags, 'explore', 'discover')
WHERE vibe_tags LIKE '%explore%';

-- Handle edge case: "EXPLORE" (all caps)
UPDATE amenity_detail
SET vibe_tags = REPLACE(vibe_tags, 'EXPLORE', 'discover')
WHERE vibe_tags LIKE '%EXPLORE%';


-- ============================================================
-- STEP 3: Update amenity_vibe_mappings table (if exists)
-- ============================================================

-- Update the vibe column in mappings table (use lowercase)
UPDATE amenity_vibe_mappings
SET vibe = 'discover'
WHERE LOWER(vibe) IN ('explore', 'Explore', 'EXPLORE');


-- ============================================================
-- STEP 4: Verify the changes
-- ============================================================

-- Count amenities with "discover" tag (lowercase)
SELECT
  terminal_code,
  COUNT(*) as discover_count
FROM amenity_detail
WHERE vibe_tags LIKE '%discover%'
GROUP BY terminal_code
ORDER BY terminal_code;

-- Check vibe_mappings (if table exists)
SELECT
  vibe,
  COUNT(*) as count
FROM amenity_vibe_mappings
WHERE vibe = 'discover'
GROUP BY vibe;


-- ============================================================
-- STEP 5: Final verification - Check for remaining "Explore"
-- ============================================================

-- This should return 0 if successful
SELECT COUNT(*) as remaining_explore_count
FROM amenity_detail
WHERE vibe_tags ILIKE '%explore%';

-- Check mappings table too (if exists)
SELECT COUNT(*) as remaining_explore_mappings
FROM amenity_vibe_mappings
WHERE LOWER(vibe) = 'explore';


-- ============================================================
-- OPTIONAL: View sample updated records
-- ============================================================

-- Show first 10 amenities with "discover" tag
SELECT
  name,
  terminal_code,
  vibe_tags
FROM amenity_detail
WHERE vibe_tags LIKE '%discover%'
LIMIT 10;


-- ============================================================
-- OPTIONAL: Check all distinct vibe_tags values
-- ============================================================

-- See what vibe values exist in your database
SELECT DISTINCT vibe_tags
FROM amenity_detail
WHERE vibe_tags IS NOT NULL
ORDER BY vibe_tags
LIMIT 50;

-- MANUAL Population Script for Collection Amenities
-- Use this if the automatic script doesn't find amenities

-- First, check what amenities are available in SYD
SELECT 
  id,
  name,
  amenity_slug,
  terminal_code,
  airport_code
FROM amenity_detail
WHERE airport_code = 'SYD'
LIMIT 20;

-- Get the collection UUIDs we need to populate
SELECT 
  id,
  collection_id,
  name
FROM collections
WHERE collection_id IN (
  'true-blue-aussie',
  'sydney-coffee',
  'coffee-chill',
  'quick-bites',
  'lounge-life',
  '24-7-heroes'
);

-- Manual population with specific amenity IDs
-- Replace the UUIDs below with actual values from your database

-- Example: Populate True Blue Aussie collection
-- Replace {COLLECTION_UUID} with the actual UUID from collections.id (NOT collection_id)
-- Replace {AMENITY_ID_1}, {AMENITY_ID_2}, etc. with actual amenity IDs from amenity_detail

/*
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
VALUES 
  ('{COLLECTION_UUID}', {AMENITY_ID_1}, 100, true),
  ('{COLLECTION_UUID}', {AMENITY_ID_2}, 90, false),
  ('{COLLECTION_UUID}', {AMENITY_ID_3}, 80, false),
  ('{COLLECTION_UUID}', {AMENITY_ID_4}, 70, false),
  ('{COLLECTION_UUID}', {AMENITY_ID_5}, 60, false)
ON CONFLICT (collection_id, amenity_detail_id) DO NOTHING;
*/

-- Alternative: Use the first available amenities for testing
-- This will add the first 5 amenities to each collection just to test
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY ad.id) * 10 as priority,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY ad.id) = 1 THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN (
  SELECT id 
  FROM amenity_detail 
  WHERE airport_code = 'SYD'
  AND terminal_code = 'T1'
  LIMIT 5
) ad
WHERE c.collection_id IN (
  'true-blue-aussie',
  'sydney-coffee', 
  'coffee-chill',
  'quick-bites'
)
ON CONFLICT (collection_id, amenity_detail_id) DO NOTHING;

-- Verify what was added
SELECT 
  c.collection_id,
  c.name as collection_name,
  COUNT(ca.amenity_detail_id) as amenity_count,
  array_agg(ad.name ORDER BY ca.priority DESC LIMIT 3) as sample_amenities
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
LEFT JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
WHERE c.collection_id IN (
  'true-blue-aussie',
  'sydney-coffee',
  'coffee-chill',
  'quick-bites'
)
AND (ad.airport_code = 'SYD' OR ad.airport_code IS NULL)
GROUP BY c.id, c.collection_id, c.name;

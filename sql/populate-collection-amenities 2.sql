-- SQL Script to populate collection_amenities with actual Sydney amenities
-- Run this in Supabase SQL Editor to fix the empty collections issue

-- First, let's see what collections and amenities we have
SELECT 
  c.id,
  c.collection_id,
  c.name as collection_name,
  (SELECT COUNT(*) FROM amenity_detail WHERE airport_code = 'SYD') as syd_amenities_available
FROM collections c
WHERE c.collection_id IN ('true-blue-aussie', 'sydney-coffee', 'coffee-chill', 'quick-bites');

-- Now let's populate the collections with appropriate amenities
-- This script maps amenities to collections based on their names/descriptions

-- 1. Populate "True Blue Aussie" collection with Australian-themed amenities
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN LOWER(ad.name) LIKE '%harbour%' THEN 100
    WHEN LOWER(ad.name) LIKE '%aussie%' THEN 90
    WHEN LOWER(ad.name) LIKE '%sydney%' THEN 80
    ELSE 50
  END as priority,
  CASE 
    WHEN LOWER(ad.name) LIKE '%harbour%' THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'true-blue-aussie'
  AND ad.airport_code = 'SYD'
  AND (
    LOWER(ad.name) LIKE '%harbour%' OR
    LOWER(ad.name) LIKE '%aussie%' OR
    LOWER(ad.name) LIKE '%sydney%' OR
    LOWER(ad.name) LIKE '%australian%' OR
    LOWER(ad.description) LIKE '%australian%' OR
    LOWER(ad.description) LIKE '%local%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 2. Populate "Sydney Coffee Culture" with coffee/cafe amenities
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN LOWER(ad.name) LIKE '%coffee%' THEN 100
    WHEN LOWER(ad.name) LIKE '%cafe%' THEN 90
    WHEN LOWER(ad.name) LIKE '%espresso%' THEN 85
    WHEN LOWER(ad.name) LIKE '%latte%' THEN 80
    ELSE 50
  END as priority,
  CASE 
    WHEN LOWER(ad.name) LIKE '%coffee club%' THEN true
    WHEN LOWER(ad.name) LIKE '%starbucks%' THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'sydney-coffee'
  AND ad.airport_code = 'SYD'
  AND (
    LOWER(ad.name) LIKE '%coffee%' OR
    LOWER(ad.name) LIKE '%cafe%' OR
    LOWER(ad.name) LIKE '%café%' OR
    LOWER(ad.name) LIKE '%espresso%' OR
    LOWER(ad.name) LIKE '%barista%' OR
    LOWER(ad.description) LIKE '%coffee%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 3. Populate "Coffee & Chill" with relaxed cafe spots
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN LOWER(ad.vibe_tags) LIKE '%relax%' THEN 100
    WHEN LOWER(ad.name) LIKE '%lounge%' THEN 90
    WHEN LOWER(ad.description) LIKE '%wifi%' THEN 85
    ELSE 50
  END as priority,
  false as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'coffee-chill'
  AND ad.airport_code = 'SYD'
  AND (
    LOWER(ad.name) LIKE '%coffee%' OR
    LOWER(ad.name) LIKE '%cafe%' OR
    LOWER(ad.name) LIKE '%café%' OR
    LOWER(ad.vibe_tags) LIKE '%chill%' OR
    LOWER(ad.vibe_tags) LIKE '%relax%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 4. Populate "Quick Bites" with fast food options
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN LOWER(ad.name) LIKE '%mcdonald%' THEN 100
    WHEN LOWER(ad.name) LIKE '%subway%' THEN 95
    WHEN LOWER(ad.name) LIKE '%burger%' THEN 90
    WHEN LOWER(ad.name) LIKE '%sandwich%' THEN 85
    WHEN LOWER(ad.name) LIKE '%express%' THEN 80
    ELSE 50
  END as priority,
  CASE 
    WHEN LOWER(ad.name) LIKE '%mcdonald%' THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'quick-bites'
  AND ad.airport_code = 'SYD'
  AND (
    LOWER(ad.name) LIKE '%quick%' OR
    LOWER(ad.name) LIKE '%fast%' OR
    LOWER(ad.name) LIKE '%express%' OR
    LOWER(ad.name) LIKE '%grab%' OR
    LOWER(ad.name) LIKE '%go%' OR
    LOWER(ad.name) LIKE '%mcdonald%' OR
    LOWER(ad.name) LIKE '%subway%' OR
    LOWER(ad.name) LIKE '%burger%' OR
    LOWER(ad.description) LIKE '%quick%' OR
    LOWER(ad.description) LIKE '%fast%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 5. Populate "Lounge Life" with lounges
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN LOWER(ad.name) LIKE '%first%' THEN 100
    WHEN LOWER(ad.name) LIKE '%business%' THEN 90
    WHEN LOWER(ad.name) LIKE '%lounge%' THEN 85
    WHEN LOWER(ad.name) LIKE '%club%' THEN 80
    ELSE 50
  END as priority,
  CASE 
    WHEN LOWER(ad.name) LIKE '%qantas%' AND LOWER(ad.name) LIKE '%first%' THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'lounge-life'
  AND ad.airport_code = 'SYD'
  AND (
    LOWER(ad.name) LIKE '%lounge%' OR
    LOWER(ad.name) LIKE '%club%' OR
    LOWER(ad.description) LIKE '%lounge%' OR
    LOWER(ad.vibe_tags) LIKE '%premium%' OR
    LOWER(ad.vibe_tags) LIKE '%luxury%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 6. Populate "24/7 Heroes" with always-open amenities
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  CASE 
    WHEN ad.opening_hours LIKE '%24%' THEN 100
    WHEN ad.opening_hours LIKE '%always%' THEN 95
    WHEN LOWER(ad.name) LIKE '%24%' THEN 90
    ELSE 50
  END as priority,
  false as is_featured
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = '24-7-heroes'
  AND ad.airport_code = 'SYD'
  AND (
    ad.opening_hours LIKE '%24%' OR
    ad.opening_hours LIKE '%always%' OR
    LOWER(ad.name) LIKE '%24%' OR
    LOWER(ad.description) LIKE '%24 hour%' OR
    LOWER(ad.description) LIKE '%always open%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- 7. Populate all other collections with some general amenities
-- This ensures every collection has at least some content
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT DISTINCT
  c.id as collection_id,
  ad.id as amenity_detail_id,
  50 as priority,
  false as is_featured
FROM collections c
CROSS JOIN (
  SELECT * FROM amenity_detail 
  WHERE airport_code = 'SYD' 
  LIMIT 10
) ad
WHERE c.airports @> ARRAY['SYD']
  AND NOT EXISTS (
    SELECT 1 FROM collection_amenities ca 
    WHERE ca.collection_id = c.id 
    AND ca.amenity_detail_id = ad.id
  )
ON CONFLICT (collection_id, amenity_detail_id) DO NOTHING;

-- Verify the results
SELECT 
  c.collection_id,
  c.name as collection_name,
  COUNT(ca.amenity_detail_id) as amenity_count,
  COUNT(CASE WHEN ca.is_featured THEN 1 END) as featured_count
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
LEFT JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
WHERE ad.airport_code = 'SYD' OR ad.airport_code IS NULL
GROUP BY c.id, c.collection_id, c.name
ORDER BY amenity_count DESC;

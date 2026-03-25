-- Fix True Blue Aussie Collection - Comprehensive Population Script
-- Run this in Supabase SQL Editor to populate the collection with amenities

-- Step 1: First, let's see what we're working with
SELECT 
  'Collections' as table_name,
  COUNT(*) as record_count
FROM collections
UNION ALL
SELECT 
  'Amenities in SYD' as table_name,
  COUNT(*) as record_count
FROM amenity_detail
WHERE airport_code = 'SYD'
UNION ALL
SELECT 
  'Collection Amenities Links' as table_name,
  COUNT(*) as record_count
FROM collection_amenities;

-- Step 2: Clear any existing entries for True Blue Aussie to start fresh
DELETE FROM collection_amenities
WHERE collection_id IN (
  SELECT id FROM collections 
  WHERE collection_id = 'true-blue-aussie'
);

-- Step 3: Get the True Blue Aussie collection ID
DO $$
DECLARE
  v_collection_id UUID;
  v_count INTEGER;
BEGIN
  -- Get the collection ID
  SELECT id INTO v_collection_id
  FROM collections
  WHERE collection_id = 'true-blue-aussie'
  LIMIT 1;
  
  IF v_collection_id IS NULL THEN
    RAISE NOTICE 'Collection true-blue-aussie not found! Creating it...';
    
    INSERT INTO collections (
      collection_id, 
      name, 
      description, 
      icon, 
      gradient,
      universal,
      featured,
      airports
    ) VALUES (
      'true-blue-aussie',
      'True Blue Aussie',
      'Iconic Australian dining experiences',
      '🇦🇺',
      'from-yellow-500 to-green-600',
      false,
      true,
      ARRAY['SYD']
    )
    RETURNING id INTO v_collection_id;
  END IF;
  
  RAISE NOTICE 'Collection ID: %', v_collection_id;
END $$;

-- Step 4: Populate with amenities based on Australian keywords
-- This is a more comprehensive approach
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT DISTINCT
  c.id as collection_id,
  ad.id as amenity_detail_id,
  -- Priority scoring based on how "Australian" the amenity is
  CASE 
    -- Highest priority for explicitly Australian names
    WHEN LOWER(ad.name) LIKE '%harbour%' THEN 100
    WHEN LOWER(ad.name) LIKE '%sydney%' THEN 95
    WHEN LOWER(ad.name) LIKE '%aussie%' THEN 95
    WHEN LOWER(ad.name) LIKE '%australian%' THEN 95
    WHEN LOWER(ad.name) LIKE '%bondi%' THEN 90
    WHEN LOWER(ad.name) LIKE '%byron%' THEN 90
    
    -- High priority for Australian food chains
    WHEN LOWER(ad.name) LIKE '%guzman%' THEN 85
    WHEN LOWER(ad.name) LIKE '%boost%' THEN 85
    WHEN LOWER(ad.name) LIKE '%mad mex%' THEN 85
    WHEN LOWER(ad.name) LIKE '%pie face%' THEN 85
    WHEN LOWER(ad.name) LIKE '%oliver%' THEN 80
    
    -- Medium priority for cafes and restaurants that might be local
    WHEN LOWER(ad.name) LIKE '%cafe%' AND ad.airport_code = 'SYD' THEN 70
    WHEN LOWER(ad.name) LIKE '%kitchen%' THEN 65
    WHEN LOWER(ad.name) LIKE '%bistro%' THEN 65
    WHEN LOWER(ad.name) LIKE '%grill%' THEN 60
    WHEN LOWER(ad.name) LIKE '%bar%' THEN 60
    
    -- Lower priority for everything else
    ELSE 50
  END as priority,
  
  -- Feature the most Australian ones
  CASE 
    WHEN LOWER(ad.name) LIKE '%harbour%' THEN true
    WHEN LOWER(ad.name) LIKE '%sydney%' THEN true
    WHEN LOWER(ad.name) LIKE '%bondi%' THEN true
    ELSE false
  END as is_featured
  
FROM collections c
CROSS JOIN amenity_detail ad
WHERE c.collection_id = 'true-blue-aussie'
  AND ad.airport_code = 'SYD'
  AND (
    -- Include anything that sounds Australian
    LOWER(ad.name) LIKE '%harbour%' OR
    LOWER(ad.name) LIKE '%sydney%' OR
    LOWER(ad.name) LIKE '%aussie%' OR
    LOWER(ad.name) LIKE '%australian%' OR
    LOWER(ad.name) LIKE '%bondi%' OR
    LOWER(ad.name) LIKE '%byron%' OR
    
    -- Include Australian chains
    LOWER(ad.name) LIKE '%guzman%' OR
    LOWER(ad.name) LIKE '%boost%' OR
    LOWER(ad.name) LIKE '%mad mex%' OR
    LOWER(ad.name) LIKE '%pie face%' OR
    LOWER(ad.name) LIKE '%oliver%' OR
    
    -- Include general food/drink places as fallback
    LOWER(ad.name) LIKE '%cafe%' OR
    LOWER(ad.name) LIKE '%coffee%' OR
    LOWER(ad.name) LIKE '%restaurant%' OR
    LOWER(ad.name) LIKE '%kitchen%' OR
    LOWER(ad.name) LIKE '%bar%' OR
    LOWER(ad.name) LIKE '%grill%' OR
    LOWER(ad.name) LIKE '%bistro%' OR
    
    -- Include based on descriptions
    LOWER(ad.description) LIKE '%australian%' OR
    LOWER(ad.description) LIKE '%local%' OR
    LOWER(ad.description) LIKE '%aussie%' OR
    LOWER(ad.description) LIKE '%sydney%'
  )
ON CONFLICT (collection_id, amenity_detail_id) DO UPDATE
SET priority = EXCLUDED.priority,
    is_featured = EXCLUDED.is_featured;

-- Step 5: If still no amenities, just add the first 20 from SYD as a fallback
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  c.id as collection_id,
  ad.id as amenity_detail_id,
  50 as priority,
  false as is_featured
FROM collections c
CROSS JOIN (
  SELECT * FROM amenity_detail 
  WHERE airport_code = 'SYD' 
  AND terminal_code = 'T1'
  ORDER BY id
  LIMIT 20
) ad
WHERE c.collection_id = 'true-blue-aussie'
  AND NOT EXISTS (
    SELECT 1 FROM collection_amenities ca 
    WHERE ca.collection_id = c.id 
    AND ca.amenity_detail_id = ad.id
  )
ON CONFLICT (collection_id, amenity_detail_id) DO NOTHING;

-- Step 6: Verify the results
SELECT 
  c.collection_id,
  c.name as collection_name,
  COUNT(DISTINCT ca.amenity_detail_id) as total_amenities,
  COUNT(DISTINCT CASE WHEN ad.terminal_code = 'T1' THEN ca.amenity_detail_id END) as t1_amenities,
  COUNT(DISTINCT CASE WHEN ca.is_featured THEN ca.amenity_detail_id END) as featured_amenities,
  STRING_AGG(DISTINCT ad.name, ', ' ORDER BY ad.name) FILTER (WHERE ca.is_featured) as featured_names
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
LEFT JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
WHERE c.collection_id = 'true-blue-aussie'
GROUP BY c.id, c.collection_id, c.name;

-- Step 7: Show sample of what was added
SELECT 
  ad.name,
  ad.terminal_code,
  ad.description,
  ca.priority,
  ca.is_featured
FROM collection_amenities ca
JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
JOIN collections c ON ca.collection_id = c.id
WHERE c.collection_id = 'true-blue-aussie'
ORDER BY ca.priority DESC, ad.name
LIMIT 10;

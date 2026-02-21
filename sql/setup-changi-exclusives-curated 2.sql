-- =====================================================
-- SETUP CHANGI EXCLUSIVES WITH CURATED 7 ATTRACTIONS
-- =====================================================

-- Step 1: Ensure Changi Exclusives collection exists
INSERT INTO collections (collection_id, name, description, icon, gradient, universal, airports, featured)
VALUES (
  'changi-exclusives',
  'Changi Exclusives',
  'Attractions you won''t find in any other airport',
  '✨',
  'from-purple-500 via-pink-500 to-cyan-500',
  false,
  ARRAY['SIN'],
  true
)
ON CONFLICT (collection_id) 
DO UPDATE SET 
  description = EXCLUDED.description,
  gradient = EXCLUDED.gradient,
  featured = true;

-- Step 2: Clear existing mappings for Changi Exclusives
DELETE FROM collection_amenities 
WHERE collection_id = (
  SELECT id FROM collections 
  WHERE collection_id = 'changi-exclusives'
);

-- Step 3: Add only the 7 curated attractions
WITH exclusive_amenities AS (
  SELECT id, name, terminal_code,
    CASE 
      WHEN name ILIKE '%rain vortex%' THEN 1
      WHEN name ILIKE '%butterfly garden%' THEN 2
      WHEN name ILIKE '%canopy park%' THEN 3
      WHEN name ILIKE '%forest valley%' OR name ILIKE '%shiseido forest%' THEN 4
      WHEN name ILIKE '%slide%t3%' OR name ILIKE '%slide@t3%' THEN 5
      WHEN name ILIKE '%entertainment deck%' THEN 6
      WHEN name ILIKE '%social tree%' THEN 7
      WHEN name ILIKE '%movie%' OR name ILIKE '%cinema%' THEN 8
      WHEN name ILIKE '%kinetic rain%' THEN 9
      ELSE 99
    END as rank
  FROM amenity_detail
  WHERE airport_code = 'SIN'
    AND (
      name ILIKE '%rain vortex%'
      OR name ILIKE '%butterfly garden%'
      OR name ILIKE '%canopy park%'
      OR name ILIKE '%forest valley%'
      OR name ILIKE '%shiseido forest%'
      OR name ILIKE '%slide%t3%'
      OR name ILIKE '%slide@t3%'
      OR name ILIKE '%entertainment deck%'
      OR name ILIKE '%social tree%'
      OR name ILIKE '%movie%theatre%'
      OR name ILIKE '%cinema%'
      OR name ILIKE '%kinetic rain%'
    )
  ORDER BY rank
  LIMIT 7
)
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  (SELECT id FROM collections WHERE collection_id = 'changi-exclusives'),
  id,
  (8 - ROW_NUMBER() OVER (ORDER BY rank)) * 10, -- Priority: 70, 60, 50, etc.
  true
FROM exclusive_amenities;

-- Step 4: Verify the results
SELECT 
  c.name as collection,
  ad.name as amenity,
  ad.terminal_code,
  ca.priority
FROM collection_amenities ca
JOIN collections c ON c.id = ca.collection_id
JOIN amenity_detail ad ON ad.id = ca.amenity_detail_id
WHERE c.collection_id = 'changi-exclusives'
ORDER BY ca.priority DESC;

-- Step 5: Create or update the RPC function for fetching collections
CREATE OR REPLACE FUNCTION get_collections_for_terminal(
  p_airport_code TEXT,
  p_terminal TEXT
)
RETURNS TABLE (
  id UUID,
  collection_id TEXT,
  name TEXT,
  description TEXT,
  icon TEXT,
  gradient TEXT,
  featured BOOLEAN,
  amenity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.collection_id,
    c.name,
    c.description,
    c.icon,
    c.gradient,
    c.featured,
    CASE 
      -- Special handling for Changi Exclusives - always show 7
      WHEN c.collection_id = 'changi-exclusives' THEN 7
      ELSE COUNT(DISTINCT ca.amenity_detail_id)
    END as amenity_count
  FROM collections c
  LEFT JOIN collection_amenities ca ON ca.collection_id = c.id
  LEFT JOIN amenity_detail ad ON ad.id = ca.amenity_detail_id
  WHERE 
    (c.universal = true OR p_airport_code = ANY(c.airports))
    AND (
      ad.airport_code = p_airport_code 
      OR c.universal = true
    )
  GROUP BY c.id, c.collection_id, c.name, c.description, c.icon, c.gradient, c.featured
  ORDER BY 
    c.featured DESC,
    CASE WHEN c.collection_id = 'changi-exclusives' THEN 0 ELSE 1 END,
    c.name;
END;
$$ LANGUAGE plpgsql;
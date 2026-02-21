-- Populate collection_amenities table with sample data
-- This creates links between collections and amenities

-- First, let's check if the table exists and create it if needed
CREATE TABLE IF NOT EXISTS collection_amenities (
  id SERIAL PRIMARY KEY,
  collection_id VARCHAR(255) NOT NULL,
  amenity_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection_id, amenity_id)
);

-- Clear existing data (optional - comment out if you want to keep existing)
-- TRUNCATE collection_amenities;

-- Helper function to link amenities to collections based on vibe tags
DO $$
DECLARE
  coll RECORD;
  amen RECORD;
BEGIN
  -- Quick Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%quick%' LIMIT 15
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id) 
    VALUES ('24-7-heroes', amen.id), ('gate-essentials', amen.id), ('2-minute-stops', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Refuel Vibe Collections  
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%refuel%' OR vibe_tags ILIKE '%food%' LIMIT 20
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('local-food-real-prices', amen.id),
      ('coffee-worth-walk', amen.id),
      ('hawker-heaven', amen.id),
      ('breakfast-champions', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Comfort Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%comfort%' OR vibe_tags ILIKE '%lounge%' LIMIT 15
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('lounge-life', amen.id),
      ('sleep-pods', amen.id),
      ('spa-wellness', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Shop Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%shop%' OR vibe_tags ILIKE '%retail%' LIMIT 20
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('duty-free-deals', amen.id),
      ('singapore-exclusives', amen.id),
      ('last-minute-gifts', amen.id),
      ('local-treasures', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Discover Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%discover%' OR vibe_tags ILIKE '%unique%' OR vibe_tags ILIKE '%explore%' LIMIT 20
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('only-at-changi', amen.id),
      ('instagram-worthy-spots', amen.id),
      ('hidden-gems', amen.id),
      ('jewel-experience', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Chill Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%chill%' OR vibe_tags ILIKE '%relax%' LIMIT 15
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('hidden-quiet-spots', amen.id),
      ('peaceful-corners', amen.id),
      ('gardens-at-dawn', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Work Vibe Collections
  FOR amen IN SELECT id FROM amenity_detail WHERE vibe_tags ILIKE '%work%' OR vibe_tags ILIKE '%business%' LIMIT 15
  LOOP
    INSERT INTO collection_amenities (collection_id, amenity_id)
    VALUES 
      ('work-spots-real-wifi', amen.id),
      ('meeting-ready-spaces', amen.id),
      ('quiet-zones', amen.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Add some specific popular amenities to multiple collections
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'quick-bites', id FROM amenity_detail 
WHERE name ILIKE '%McDonald%' OR name ILIKE '%Subway%' OR name ILIKE '%Starbucks%'
ON CONFLICT DO NOTHING;

INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'local-eats', id FROM amenity_detail 
WHERE name ILIKE '%hawker%' OR name ILIKE '%kopitiam%' OR name ILIKE '%food court%'
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 
  c.collection_id,
  c.name as collection_name,
  COUNT(ca.amenity_id) as amenity_count
FROM collections c
LEFT JOIN collection_amenities ca ON c.collection_id = ca.collection_id
GROUP BY c.collection_id, c.name
ORDER BY amenity_count DESC;

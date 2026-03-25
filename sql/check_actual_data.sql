-- Check what data you actually have in your tables
-- Run this to understand your current data structure

-- 1. Show structure and sample data from vibe_collections
SELECT 'vibe_collections structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vibe_collections';

SELECT 'vibe_collections sample data:' as info;
SELECT * FROM vibe_collections LIMIT 5;

-- 2. Show structure and sample data from collection_amenities
SELECT 'collection_amenities structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'collection_amenities';

SELECT 'collection_amenities sample data:' as info;
SELECT * FROM collection_amenities LIMIT 5;

-- 3. Show structure and sample data from amenity_detail
SELECT 'amenity_detail structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'amenity_detail';

SELECT 'amenity_detail sample data:' as info;
SELECT * FROM amenity_detail LIMIT 3;
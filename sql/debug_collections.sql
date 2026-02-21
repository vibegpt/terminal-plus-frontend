-- Debug script to understand the collection structure and relationships
-- Run this in your Supabase SQL editor

-- 1. Check the structure of the collections table
SELECT 
    id as uuid_id,
    collection_id as slug,
    name,
    description,
    airports
FROM collections
WHERE airports LIKE '%SIN%' OR airports IS NULL
LIMIT 10;

-- 2. Check which collections have amenities
SELECT 
    c.collection_id as collection_slug,
    c.name as collection_name,
    c.id as collection_uuid,
    COUNT(ca.amenity_id) as amenity_count
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
WHERE c.airports LIKE '%SIN%' OR c.airports IS NULL
GROUP BY c.id, c.collection_id, c.name
ORDER BY amenity_count DESC
LIMIT 20;

-- 3. Check specific collection (e.g., 'quick-bites')
SELECT 
    c.collection_id as slug,
    c.name,
    c.id as uuid,
    ca.amenity_id,
    ad.name as amenity_name,
    ad.terminal_code
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
LEFT JOIN amenity_detail ad ON ca.amenity_id = ad.id
WHERE c.collection_id = 'quick-bites'
LIMIT 10;

-- 4. List all collection slugs that exist
SELECT DISTINCT 
    collection_id as slug,
    name,
    id as uuid,
    airports
FROM collections
WHERE collection_id IS NOT NULL
ORDER BY collection_id;

-- 5. Check if any collections use the slug format we expect
SELECT 
    collection_id,
    name,
    id
FROM collections
WHERE collection_id IN (
    'quick-bites', 
    'local-eats', 
    'coffee-worth-walk',
    'lounge-life',
    'sleep-pods',
    'duty-free-deals',
    'only-at-changi',
    '24-7-heroes'
);

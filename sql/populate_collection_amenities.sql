-- SQL script to populate collection_amenities table
-- This creates the relationships between collections and amenities

-- First, ensure the collection_amenities table exists
CREATE TABLE IF NOT EXISTS collection_amenities (
    id SERIAL PRIMARY KEY,
    collection_id VARCHAR(255) NOT NULL,
    amenity_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, amenity_id)
);

-- Clear existing data for clean setup (optional)
-- DELETE FROM collection_amenities WHERE collection_id IN ('quick-bites', 'local-eats', 'coffee-worth-walk');

-- Quick Bites Collection - Fast food and grab & go
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'quick-bites', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%mcdonald%' 
    OR LOWER(name) LIKE '%burger king%'
    OR LOWER(name) LIKE '%subway%'
    OR LOWER(name) LIKE '%kfc%'
    OR LOWER(name) LIKE '%pizza%'
    OR LOWER(name) LIKE '%sandwich%'
    OR LOWER(name) LIKE '%grab%'
    OR LOWER(description) LIKE '%fast food%'
    OR LOWER(description) LIKE '%quick%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Local Eats Collection - Singapore local food
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'local-eats', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%kopitiam%'
    OR LOWER(name) LIKE '%hawker%'
    OR LOWER(name) LIKE '%local%'
    OR LOWER(name) LIKE '%singapore%'
    OR LOWER(name) LIKE '%asian%'
    OR LOWER(name) LIKE '%noodle%'
    OR LOWER(name) LIKE '%rice%'
    OR LOWER(description) LIKE '%local%'
    OR LOWER(description) LIKE '%authentic%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Coffee Worth Walk Collection
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'coffee-worth-walk', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%coffee%'
    OR LOWER(name) LIKE '%cafe%'
    OR LOWER(name) LIKE '%starbucks%'
    OR LOWER(name) LIKE '%costa%'
    OR LOWER(name) LIKE '%bean%'
    OR LOWER(name) LIKE '%espresso%'
    OR LOWER(name) LIKE '%latte%'
    OR LOWER(description) LIKE '%coffee%'
    OR LOWER(description) LIKE '%cafe%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Lounge Life Collection
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'lounge-life', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%lounge%'
    OR LOWER(name) LIKE '%club%'
    OR LOWER(name) LIKE '%vip%'
    OR LOWER(name) LIKE '%first class%'
    OR LOWER(name) LIKE '%business class%'
    OR LOWER(description) LIKE '%lounge%'
    OR LOWER(description) LIKE '%premium%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Sleep Pods Collection
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'sleep-pods', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%sleep%'
    OR LOWER(name) LIKE '%snooze%'
    OR LOWER(name) LIKE '%rest%'
    OR LOWER(name) LIKE '%nap%'
    OR LOWER(name) LIKE '%pod%'
    OR LOWER(description) LIKE '%sleep%'
    OR LOWER(description) LIKE '%rest%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Duty Free Deals Collection
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'duty-free-deals', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%duty free%'
    OR LOWER(name) LIKE '%dfs%'
    OR LOWER(name) LIKE '%shop%'
    OR LOWER(name) LIKE '%store%'
    OR LOWER(name) LIKE '%retail%'
    OR LOWER(description) LIKE '%duty free%'
    OR LOWER(description) LIKE '%shop%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Only at Changi Collection (Discover vibe)
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT 'only-at-changi', id FROM amenity_detail
WHERE 
    (LOWER(name) LIKE '%jewel%'
    OR LOWER(name) LIKE '%butterfly%'
    OR LOWER(name) LIKE '%garden%'
    OR LOWER(name) LIKE '%waterfall%'
    OR LOWER(name) LIKE '%canopy%'
    OR LOWER(name) LIKE '%slide%'
    OR LOWER(name) LIKE '%movie%'
    OR LOWER(description) LIKE '%unique%'
    OR LOWER(description) LIKE '%attraction%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- 24/7 Heroes Collection
INSERT INTO collection_amenities (collection_id, amenity_id)
SELECT '24-7-heroes', id FROM amenity_detail
WHERE 
    (LOWER(opening_hours) LIKE '%24%'
    OR LOWER(opening_hours) LIKE '%24/7%'
    OR LOWER(opening_hours) LIKE '%24 hours%'
    OR LOWER(description) LIKE '%24 hour%'
    OR LOWER(description) LIKE '%overnight%')
    AND terminal_code IN ('SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'T1', 'T2', 'T3', 'T4')
ON CONFLICT (collection_id, amenity_id) DO NOTHING
LIMIT 20;

-- Add more collections as needed...

-- Verify the data was inserted
SELECT 
    collection_id,
    COUNT(*) as amenity_count
FROM collection_amenities
GROUP BY collection_id
ORDER BY collection_id;

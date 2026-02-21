-- Safe diagnostic SQL that discovers your actual table structure
-- Run this in your Supabase SQL Editor

-- 1. Check what tables exist related to collections/amenities
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%amenities%' OR table_name LIKE '%collection%')
ORDER BY table_name;

-- 2. Check the COMPLETE structure of the 'collections' table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'collections'
ORDER BY ordinal_position;

-- 3. Check if there are any records in collections table
SELECT COUNT(*) as total_collections FROM collections;

-- 4. Show ALL columns from first 3 rows to see what data you actually have
SELECT * FROM collections LIMIT 3;

-- 5. If the table exists but is empty, let's check other related tables
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_name IN ('amenities', 'amenity_detail', 'collection_amenities', 'vibe_collections')
ORDER BY table_name;
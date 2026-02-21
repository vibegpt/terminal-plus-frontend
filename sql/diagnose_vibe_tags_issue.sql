-- Diagnostic SQL to understand the current vibe_tags issue
-- Run this in your Supabase SQL Editor to understand the current state

-- 1. Check what tables exist related to collections/amenities
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%amenities%' OR table_name LIKE '%collection%')
ORDER BY table_name;

-- 2. Check the structure of the 'collections' table (what HomePage.tsx queries)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'collections'
ORDER BY ordinal_position;

-- 3. Check if there are any records in collections table
SELECT
    COUNT(*) as total_collections,
    'UUID format' as id_type
FROM collections;

-- 4. Show first 5 rows from collections to see current vibe_tags format
SELECT
    id,
    collection_name,
    vibe_tags,
    pg_typeof(vibe_tags) as vibe_tags_type
FROM collections
LIMIT 5;

-- 5. Check if vibe_tags contains arrays or strings
SELECT
    id,
    collection_name,
    vibe_tags,
    CASE
        WHEN vibe_tags IS NULL THEN 'NULL'
        WHEN pg_typeof(vibe_tags) = 'text[]'::regtype THEN 'ARRAY'
        WHEN pg_typeof(vibe_tags) = 'text'::regtype THEN 'STRING'
        ELSE 'OTHER: ' || pg_typeof(vibe_tags)::text
    END as data_format
FROM collections
WHERE vibe_tags IS NOT NULL
LIMIT 10;

-- 6. Test what format your queries expect
-- This query should work if vibe_tags is an array column
-- SELECT * FROM collections WHERE vibe_tags @> ARRAY['comfort'];

-- 7. This query should work if vibe_tags is a text column
-- SELECT * FROM collections WHERE vibe_tags ILIKE '%comfort%';
-- Check the exact format of vibe_tags in your database
-- Run this in Supabase SQL Editor

-- 1. Check the column data type
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'amenity_detail'
  AND column_name = 'vibe_tags';

-- 2. Check the constraint definition
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'amenity_detail'
  AND con.conname LIKE '%vibe%';

-- 3. Look at actual data examples
SELECT
  name,
  vibe_tags,
  pg_typeof(vibe_tags) AS type,
  length(vibe_tags) AS length
FROM amenity_detail
WHERE vibe_tags IS NOT NULL
LIMIT 10;

-- 4. Check if it's an array type
SELECT
  name,
  vibe_tags,
  CASE
    WHEN pg_typeof(vibe_tags)::text = 'text[]' THEN 'ARRAY'
    WHEN pg_typeof(vibe_tags)::text = 'text' THEN 'STRING'
    ELSE pg_typeof(vibe_tags)::text
  END AS format_type
FROM amenity_detail
WHERE vibe_tags IS NOT NULL
LIMIT 5;

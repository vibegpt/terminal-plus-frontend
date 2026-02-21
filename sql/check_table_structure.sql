-- Check the actual structure of collection_amenities table
-- Run this to see what columns exist

-- 1. Get column information for collection_amenities
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns
WHERE 
    table_name = 'collection_amenities'
ORDER BY 
    ordinal_position;

-- 2. Also check first few rows to see the data
SELECT * 
FROM collection_amenities 
LIMIT 5;

-- 3. Check if there's a relationship to amenity_detail
SELECT 
    ca.*,
    ad.name as amenity_name
FROM collection_amenities ca
LEFT JOIN amenity_detail ad ON ca.amenity_id = ad.id
WHERE ca.collection_id = 'e494567b-69f4-44ac-bdd0-92846d8522fd'
LIMIT 5;

-- SQL Script to differentiate the two coffee collections in Supabase
-- Run this in Supabase SQL Editor

-- 1. Update Sydney Coffee Culture to be more distinctive (orange/amber with trophy icon)
UPDATE collections 
SET 
  name = 'Sydney Coffee Culture',
  description = 'Melbourne''s rival - Sydney''s serious barista scene and award-winning roasters',
  icon = '🏆',
  gradient = 'from-amber-600 to-orange-800'
WHERE collection_id = 'sydney-coffee-culture';

-- 2. Update Coffee & Chill to be more relaxed/universal (blue/teal with coffee icon)
UPDATE collections 
SET 
  name = 'Coffee & Chill',
  description = 'Relaxed cafés perfect for unwinding with a cuppa and free WiFi',
  icon = '☕',
  gradient = 'from-blue-700 to-teal-600'
WHERE collection_id = 'coffee-chill';

-- 3. Verify the changes
SELECT 
  collection_id,
  name,
  description,
  icon,
  gradient,
  universal,
  featured
FROM collections 
WHERE collection_id IN ('sydney-coffee-culture', 'coffee-chill');

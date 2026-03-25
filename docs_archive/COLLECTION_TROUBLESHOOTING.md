# Collection Loading Troubleshooting Guide

## 🔍 Debugging Steps

### 1. Check Browser Console
Open Chrome DevTools (F12) and look for these log messages:

```
=== SupabaseCollectionService.getCollectionWithAmenities ===
Input - collectionSlug: [should show collection ID]
Input - terminalCode: [should show like SYD-T1]
```

### 2. Common Issues & Solutions

#### Issue: "Collection not found"
**Check in console for:**
```
❌ Collection not found: 
Available collections: [list of collections]
```

**Solutions:**
- The collection_id in URL doesn't match database
- Check if collection_id vs collection_slug mismatch
- Run this SQL in Supabase to verify:
```sql
SELECT collection_id, name FROM collections;
```

#### Issue: "No amenities found"
**Check in console for:**
```
⚠️ No amenities found for collection in airport: SYD
This collection has amenities in airports: [list]
```

**Solutions:**
- Collection exists but has no amenities for that airport
- Check collection_amenities table has mappings
- Run this SQL to verify:
```sql
-- Check if collection has any amenities
SELECT 
  c.collection_id,
  c.name as collection_name,
  COUNT(ca.amenity_detail_id) as amenity_count,
  array_agg(DISTINCT ad.airport_code) as airports
FROM collections c
LEFT JOIN collection_amenities ca ON c.id = ca.collection_id
LEFT JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
WHERE c.collection_id = 'coffee-chill' -- Replace with your collection
GROUP BY c.id, c.collection_id, c.name;
```

#### Issue: Network/CORS Error
**Check Network tab for:**
- 401 Unauthorized
- CORS errors
- 500 server errors

**Solutions:**
- Check Supabase URL and anon key in .env
- Verify Supabase RLS policies
- Check if tables have public read access

### 3. Quick Fix SQL Scripts

#### Create Test Data for Sydney Coffee Collections
```sql
-- First, get the collection IDs
SELECT id, collection_id, name FROM collections 
WHERE collection_id IN ('coffee-chill', 'sydney-coffee-culture');

-- Then insert test amenities if missing
-- Replace {collection_uuid} with actual UUID from above query
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT 
  '{collection_uuid}', -- Replace with actual collection.id (not collection_id!)
  ad.id,
  1,
  false
FROM amenity_detail ad
WHERE ad.airport_code = 'SYD' 
  AND ad.terminal_code = 'T1'
  AND (
    LOWER(ad.name) LIKE '%coffee%' OR 
    LOWER(ad.name) LIKE '%cafe%' OR
    LOWER(ad.name) LIKE '%espresso%'
  )
LIMIT 5
ON CONFLICT DO NOTHING;
```

### 4. Test Direct in Supabase

Run this query in Supabase SQL editor to simulate what the app is doing:

```sql
-- Test what the app sees for a collection
WITH collection_data AS (
  SELECT * FROM collections 
  WHERE collection_id = 'coffee-chill' -- your collection slug
  LIMIT 1
)
SELECT 
  cd.*,
  (
    SELECT COUNT(*)
    FROM collection_amenities ca
    JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
    WHERE ca.collection_id = cd.id
      AND ad.airport_code = 'SYD' -- your airport
  ) as amenity_count,
  (
    SELECT json_agg(
      json_build_object(
        'id', ad.id,
        'name', ad.name,
        'terminal', ad.terminal_code
      )
    )
    FROM collection_amenities ca
    JOIN amenity_detail ad ON ca.amenity_detail_id = ad.id
    WHERE ca.collection_id = cd.id
      AND ad.airport_code = 'SYD'
    LIMIT 5
  ) as sample_amenities
FROM collection_data cd;
```

### 5. Navigation State Check

In terminal-best-of.tsx, update handleCollectionClick to log what's being passed:

```typescript
const handleCollectionClick = (collection: any) => {
  console.log('=== Collection Click Debug ===');
  console.log('Collection data:', collection);
  console.log('Terminal code:', terminalCode);
  console.log('Collection slug:', collection.collection_slug);
  
  navigate(`/collection/${terminalCode}/${collection.collection_slug}`, {
    state: { 
      preview: {
        name: collection.collection_name,
        icon: collection.collection_icon,
        gradient: collection.collection_gradient,
        itemCount: collection.terminal_amenity_count
      }
    }
  });
};
```

### 6. Manual Test URLs

Try these URLs directly to test:
- `/collection/SYD-T1/coffee-chill`
- `/collection/SYD-T1/sydney-coffee-culture`
- `/collection/SYD-T1/true-blue-aussie`

### 7. Check Data Flow

The data flow should be:
1. **terminal-best-of** → Fetches collections from Supabase
2. **User clicks** → Navigate with collection_slug
3. **collection-detail** → Uses collection_slug to fetch from Supabase
4. **SupabaseCollectionService** → Queries collections and amenities

### 8. Emergency Fallback

If nothing works, create a temporary mock in SupabaseCollectionService:

```typescript
// Add this at the start of getCollectionWithAmenities
if (collectionSlug === 'coffee-chill' && terminalCode === 'SYD-T1') {
  console.log('Using mock data for testing');
  return {
    collection: {
      id: 'mock-1',
      collection_id: 'coffee-chill',
      name: 'Coffee & Chill',
      title: 'Coffee & Chill',
      subtitle: 'Relaxed cafés with WiFi',
      description: 'Perfect spots to unwind',
      emoji: '☕',
      icon: '☕',
      gradient: 'from-blue-700 to-teal-600',
      universal: true,
      featured: false,
      airports: ['SYD']
    },
    amenities: [{
      id: 1,
      amenity_slug: 'test-cafe',
      name: 'Test Café',
      description: 'A test café for debugging',
      terminal_code: 'T1',
      airport_code: 'SYD',
      vibe_tags: ['Relaxed', 'WiFi'],
      price_level: '$$',
      opening_hours: null,
      category: 'Café',
      rating: 4.5
    }]
  };
}
```

## 🎯 Most Likely Issues

Based on the symptoms, check these first:

1. **Collection slug mismatch** - The URL uses `collection_slug` but database might have different value
2. **No amenity mappings** - Collection exists but `collection_amenities` table is empty
3. **Airport code mismatch** - Amenities exist but for different airport (e.g., SIN instead of SYD)
4. **Missing Supabase connection** - Check .env variables are loaded

## 📊 Verification Query

Run this comprehensive check in Supabase:

```sql
-- Complete diagnostic query
SELECT 
  'Collections' as check_type,
  COUNT(*) as count
FROM collections
UNION ALL
SELECT 
  'Collection Amenities Mappings',
  COUNT(*)
FROM collection_amenities
UNION ALL
SELECT 
  'Amenities in SYD',
  COUNT(*)
FROM amenity_detail
WHERE airport_code = 'SYD'
UNION ALL
SELECT 
  'Coffee Collections',
  COUNT(*)
FROM collections
WHERE collection_id LIKE '%coffee%';
```

## 🚨 Quick Action Items

1. **Check console logs** - Look for the debug output
2. **Verify collection exists** - Run SQL query above
3. **Check amenity mappings** - Ensure collection_amenities has records
4. **Test with mock data** - Add temporary mock to isolate issue
5. **Report findings** - Share console errors and SQL results

This should help identify where the data flow is breaking!
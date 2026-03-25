# 🔄 Dynamic Table Configuration for Terminal+

## ✅ Problem Solved

Your app is **no longer hardcoded** to `amenity_detail_rows11`. It now:
- **Fetches from configurable tables** that can be changed easily
- **Has automatic fallbacks** if a table doesn't exist
- **Updates dynamically** when you change the configuration

## 📊 How It Works

### 1. **Configuration File** (`src/config/database.ts`)
Central location for all table names:
```typescript
export const DB_TABLES = {
  AMENITIES: 'amenity_detail_rows11', // Main table
  AMENITIES_DETAIL: 'amenity_detail', // Fallback
  AMENITIES_NEW: 'syd_t1_new_dining_amenities', // Additional
};
```

### 2. **Dynamic Table Selection**
The `getAmenitiesTable()` function determines which table to use:
```typescript
// Checks environment variable first
if (import.meta.env.VITE_AMENITIES_TABLE) {
  return import.meta.env.VITE_AMENITIES_TABLE;
}
// Falls back to default
return DB_TABLES.AMENITIES;
```

### 3. **Automatic Fallbacks**
If the primary table fails, it automatically tries:
1. `amenity_detail` 
2. `amenities`
3. `syd_t1_new_dining_amenities`

## 🎯 How to Change Tables

### Option 1: Environment Variable (Recommended)
Edit `.env.local`:
```bash
# Change to any table name
VITE_AMENITIES_TABLE=amenity_detail
```
Then restart your dev server.

### Option 2: Update Config File
Edit `src/config/database.ts`:
```typescript
export const DB_TABLES = {
  AMENITIES: 'your_new_table_name', // Change this
  //...
};
```

### Option 3: Runtime Switching
You could extend the config to switch tables based on:
- Terminal codes
- User preferences
- Time of day
- API responses

## 🔍 Current Configuration

Your app currently uses:
- **Primary Table:** `amenity_detail_rows11` (768 amenities)
- **Fallback Tables:** 
  - `amenity_detail`
  - `amenities`
  - `syd_t1_new_dining_amenities` (36 dining amenities)

## 📱 Testing Different Tables

### Test with Different Data Sources:
```bash
# Use the main table (768 amenities)
VITE_AMENITIES_TABLE=amenity_detail_rows11 npm run dev

# Use dining-only table (36 amenities)
VITE_AMENITIES_TABLE=syd_t1_new_dining_amenities npm run dev

# Use standard table
VITE_AMENITIES_TABLE=amenity_detail npm run dev
```

## 🚀 Live Updates

When your Supabase tables update:
1. **No code changes needed** - just update the env variable
2. **Real-time sync** - fetches fresh data on each request
3. **Automatic migration** - fallbacks handle table transitions

## 🔧 Advanced: Multiple Tables

You can query multiple tables simultaneously:
```typescript
// In your component
const mainData = await supabase.from('amenity_detail_rows11').select('*');
const diningData = await supabase.from('syd_t1_new_dining_amenities').select('*');
const combined = [...mainData.data, ...diningData.data];
```

## 📊 Database Schema Expected

All amenity tables should have these fields:
- `id` (number)
- `amenity_slug` (string)
- `name` (string)
- `description` (string)
- `terminal_code` (string)
- `airport_code` (string)
- `vibe_tags` (string)
- `price_level` (string)
- `opening_hours` (string/json)
- `website_url` (string/null)
- `logo_url` (string/null)
- `booking_required` (boolean)
- `available_in_tr` (boolean)

## 🎉 Benefits

- ✅ **No more hardcoding** - table names are configurable
- ✅ **Easy migration** - switch tables without code changes
- ✅ **Automatic fallbacks** - never breaks if a table is missing
- ✅ **Live updates** - always fetches current data
- ✅ **Multiple sources** - can combine data from many tables

## 🔄 When Supabase Updates

When you update data in Supabase:
1. Changes appear **immediately** in the app
2. No deployment needed
3. No code changes required
4. Just refresh the page to see updates

The app now intelligently fetches from whatever table you configure, with automatic fallbacks to ensure it never breaks! 🚀
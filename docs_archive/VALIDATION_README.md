# 🎯 Terminal & Collection Validation Guide

## 🚀 Quick Start

### 1. **Import Validation Utilities**
```typescript
import { 
  isValidTerminalCode, 
  isValidCollectionSlug, 
  validateTerminalAndCollection,
  VALID_TERMINALS,
  VALID_COLLECTION_SLUGS 
} from '@/utils/validationUtils';
```

### 2. **Use in Components**
```typescript
// Simple validation
if (isValidTerminalCode(terminalCode)) {
  console.log('✅ Valid terminal');
}

// Comprehensive validation
const validation = validateTerminalAndCollection(terminalCode, collectionSlug);
if (validation.bothValid) {
  console.log(`Loading: ${validation.terminalName} - ${validation.collectionName}`);
}
```

---

## 🔍 **Debugging Features Added**

### **Console Validation**
All components now include automatic validation with helpful console messages:

```typescript
// ✅ Success messages
console.log('✅ Valid terminal: SIN-T3 (Terminal 3)');
console.log('✅ Valid collection slug: hawker-heaven (Hawker Heaven 🥟)');

// ⚠️ Warning messages
console.warn('⚠️  Invalid terminal: T3. Valid formats: ["SIN-T1", "SIN-T2", ...]');
console.warn('⚠️  Invalid collection slug: hawker_heaven. Valid formats: ["hawker-heaven", ...]');
```

### **Browser Console Testing**
Run this in your browser console to test validation:

```javascript
// Copy the test script from src/utils/consoleTestScript.ts
// Then run:
testCollection('SIN-T3', 'hawker-heaven');     // ✅ Should pass
testCollection('SIN T3', 'hawker_heaven');     // ❌ Should fail
```

---

## 📋 **Valid Terminal Codes**

### **Singapore (SIN)**
- `SIN-T1` - Terminal 1
- `SIN-T2` - Terminal 2  
- `SIN-T3` - Terminal 3
- `SIN-T4` - Terminal 4
- `SIN-JEWEL` - Jewel Complex

### **Sydney (SYD)**
- `SYD-T1` - Terminal 1 (International)
- `SYD-T2` - Terminal 2 (Domestic)
- `SYD-T3` - Terminal 3 (Qantas Domestic)
- `SYD-TD` - Terminal Domestic

### **London Heathrow (LHR)**
- `LHR-T2` - Terminal 2
- `LHR-T3` - Terminal 3
- `LHR-T4` - Terminal 4
- `LHR-T5` - Terminal 5

---

## 📚 **Valid Collection Slugs**

### **Universal Collections (All Airports)**
- `quick-bites` - ⚡ Fast food & grab-and-go
- `24-7-heroes` - 🌙 24-hour amenities
- `coffee-chill` - ☕ Cafes & coffee shops
- `lounge-life` - 💎 Airport lounges
- `duty-free-deals` - 🛍️ Duty-free shopping
- `healthy-choices` - 🥗 Healthy food options
- `stay-connected` - 📱 WiFi & charging stations
- `last-minute-essentials` - 🎁 Convenience stores
- `power-hour` - ⚡ Quick services

### **Singapore-Specific Collections**
- `hawker-heaven` - 🥟 Local hawker food
- `garden-city-gems` - 🦋 Gardens & nature spots
- `changi-exclusives` - ✨ Unique Changi attractions
- `jewel-wonders` - 💎 Jewel attractions
- `kiasu-essentials` - 🇸🇬 Must-try Singapore experiences

### **Sydney-Specific Collections**
- `true-blue-aussie` - 🇦🇺 Australian cuisine
- `sydney-coffee-culture` - ☕ Local coffee spots
- `harbour-views` - 🌊 Spots with views

---

## 🛠️ **Validation Functions**

### **Basic Validation**
```typescript
import { isValidTerminalCode, isValidCollectionSlug } from '@/utils/validationUtils';

// Check individual values
const terminalValid = isValidTerminalCode('SIN-T3');        // true
const collectionValid = isValidCollectionSlug('hawker-heaven'); // true
```

## 🪝 **Collection Hooks**

### **useCollectionAmenities Hook**
```typescript
import { useCollectionAmenities } from '@/hooks/useAmenities';

// Automatically fetches and filters amenities for a specific collection
const { amenities, loading, error, totalCount } = useCollectionAmenities('SIN-T3', 'hawker-heaven');

// Returns filtered amenities (e.g., 3 hawker centers in T3)
// Falls back to local JSON data if Supabase is unavailable
```

### **useSupabaseCollections Hook**
```typescript
import { useSupabaseCollections } from '@/hooks/useAmenities';

// Direct Supabase RPC call for collections
const { collections, loading, error } = useSupabaseCollections('SIN', 'T3');

// Equivalent to your example:
// const { data } = await supabase.rpc('get_collections_for_terminal', {
//   p_airport_code: 'SIN', p_terminal: 'T3'
// });
```

### **Comprehensive Validation**
```typescript
import { validateTerminalAndCollection } from '@/utils/validationUtils';

const validation = validateTerminalAndCollection('SIN-T3', 'hawker-heaven');

console.log(validation);
// {
//   terminalValid: true,
//   collectionValid: true,
//   bothValid: true,
//   terminalName: 'Terminal 3',
//   collectionName: 'Hawker Heaven 🥟'
// }
```

### **Format Validation (Regex)**
```typescript
import { validateTerminalFormat, validateCollectionSlugFormat } from '@/utils/validationUtils';

// Format patterns from reference guide
validateTerminalFormat('SIN-T3');        // true (matches /^[A-Z]{3}-[A-Z0-9]+$/)
validateCollectionSlugFormat('hawker-heaven'); // true (matches /^[a-z-]+$/)
```

---

## 🎨 **Collection Metadata**

### **Get Collection Info**
```typescript
import { getCollectionMetadata, getTerminalMetadata } from '@/utils/validationUtils';

const collectionInfo = getCollectionMetadata('hawker-heaven');
// { name: 'Hawker Heaven 🥟', description: 'Local hawker food' }

const terminalInfo = getTerminalMetadata('SIN-T3');
// 'Terminal 3'
```

### **Get All Valid Values**
```typescript
import { getValidTerminals, getValidCollectionSlugs } from '@/utils/validationUtils';

const terminals = getValidTerminals();
const collections = getValidCollectionSlugs();
```

---

## 🔧 **Integration Examples**

### **React Hook with Validation**
```typescript
import { useCollectionAmenities } from '@/hooks/useAmenities';
import { validateTerminalAndCollection } from '@/utils/validationUtils';

function CollectionDetail({ terminalCode, collectionSlug }) {
  // Validate before using
  const validation = validateTerminalAndCollection(terminalCode, collectionSlug);
  
  if (!validation.bothValid) {
    return <div>Invalid terminal or collection</div>;
  }
  
  const { amenities, loading } = useCollectionAmenities(terminalCode, collectionSlug);
  
  return (
    <div>
      <h1>{validation.collectionName}</h1>
      {/* Render amenities */}
    </div>
  );
}
```

### **Direct Supabase RPC Usage**
```typescript
import { useSupabaseCollections } from '@/hooks/useAmenities';

function CollectionsList({ airportCode, terminal }) {
  const { collections, loading, error } = useSupabaseCollections(airportCode, terminal);
  
  if (loading) return <div>Loading collections...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {collections.map(collection => (
        <div key={collection.collection_uuid}>
          <h3>{collection.collection_name}</h3>
          <p>{collection.spots_total} spots available</p>
        </div>
      ))}
    </div>
  );
}
```

### **Combined Approach**
```typescript
// Get collections from Supabase, then amenities for specific collection
function CollectionDetail({ airportCode, terminal, collectionSlug }) {
  const { collections } = useSupabaseCollections(airportCode, terminal);
  const { amenities } = useCollectionAmenities(`${airportCode}-${terminal}`, collectionSlug);
  
  return (
    <div>
      <h2>Available Collections: {collections.length}</h2>
      <h3>Current Collection Amenities: {amenities.length}</h3>
    </div>
  );
}
```

### **Navigation with Validation**
```typescript
import { isValidTerminalCode, isValidCollectionSlug } from '@/utils/validationUtils';

const handleCollectionClick = (terminalCode, collectionSlug) => {
  if (isValidTerminalCode(terminalCode) && isValidCollectionSlug(collectionSlug)) {
    navigate(`/collection/${terminalCode}/${collectionSlug}`);
  } else {
    console.error('Invalid navigation parameters');
  }
};
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid terminal format"**
**Solution**: Ensure terminal code follows `[A-Z]{3}-[A-Z0-9]+` pattern
```typescript
// ❌ Wrong
'SIN T3'    // Space instead of hyphen
'T3'        // Missing airport code
'sin-t3'    // Lowercase

// ✅ Correct
'SIN-T3'    // Proper format
'SIN-JEWEL' // Special terminal
```

### **Issue: "Invalid collection slug"**
**Solution**: Use exact slugs from the reference guide
```typescript
// ❌ Wrong
'hawker_heaven'  // Underscore instead of hyphen
'hawkerheaven'   // Missing hyphen
'HAWKER-HEAVEN'  // Uppercase

// ✅ Correct
'hawker-heaven'  // Exact match from guide
'quick-bites'    // Universal collection
```

### **Issue: Navigation not working**
**Solution**: Validate parameters before navigation
```typescript
// ✅ Good - validate first
if (isValidTerminalCode(terminalCode) && isValidCollectionSlug(collectionSlug)) {
  navigate(`/collection/${terminalCode}/${collectionSlug}`);
}

// ❌ Bad - no validation
navigate(`/collection/${terminalCode}/${collectionSlug}`);
```

---

## 🧪 **Testing & Debugging**

### **1. Console Validation**
All components now log validation status automatically.

### **2. Browser Console Testing**
```javascript
// Copy the test script to clipboard
import { copyTestScriptToClipboard } from '@/utils/consoleTestScript';
copyTestScriptToClipboard();

// Then paste and run in browser console
testCollection('SIN-T3', 'hawker-heaven');
```

### **3. Component Debug Mode**
```typescript
// Add to any component for debugging
useEffect(() => {
  const validation = validateTerminalAndCollection(terminalCode, collectionSlug);
  console.log('Validation result:', validation);
}, [terminalCode, collectionSlug]);
```

---

## 📚 **Files Created/Updated**

- ✅ `src/utils/validationUtils.ts` - Main validation utility
- ✅ `src/utils/consoleTestScript.ts` - Browser console testing
- ✅ `src/pages/VibesFeedMVP.tsx` - Added validation
- ✅ `src/pages/collection-detail-optimized.tsx` - Added validation
- ✅ `src/components/CollectionDetailExample.tsx` - Added validation
- ✅ `src/components/CollectionDetailWithRoute.tsx` - Route example

---

## 🎯 **Next Steps**

1. **Test validation** in your browser console
2. **Update components** to use the validation utilities
3. **Add validation** to any new collection-related components
4. **Use the reference guide** for all terminal codes and collection slugs

The validation system now perfectly matches your reference guide specifications! 🚀

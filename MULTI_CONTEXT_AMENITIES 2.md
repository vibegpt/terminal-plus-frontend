# 🎭 Multi-Context Amenities System

## 📋 **Overview**

The Multi-Context Amenities system allows the same amenity to appear in different collections with contextual messaging, different emphasis points, and tailored call-to-actions based on the user's current context.

## 🎯 **Key Concept**

Instead of duplicating amenities across collections, the same amenity can serve multiple purposes:

```typescript
// The same amenity appears in different collections with different messaging
<ExploreCollection>
  <AmenityCard name="Butterfly Garden" context="Discover tropical species" />
</ExploreCollection>

<ChillCollection>
  <AmenityCard name="Butterfly Garden" context="Peaceful nature escape" />
</ChillCollection>

<ChangiExclusives>
  <AmenityCard name="Butterfly Garden" context="World's largest butterfly habitat" />
</ChangiExclusives>
```

## 🏗️ **System Architecture**

### **1. Context Definitions (`src/utils/amenityContexts.ts`)**
- **`AmenityContext`** interface defines context-specific properties
- **`MultiContextAmenity`** interface defines the base amenity with multiple contexts
- **`AMENITY_CONTEXTS`** constant stores all context mappings

### **2. Context-Aware Components (`src/components/ContextAwareAmenityCard.tsx`)**
- Automatically detects and applies context-specific styling
- Shows contextual badges, descriptions, and call-to-actions
- Maintains consistent amenity information across collections

### **3. Enhanced Hooks (`src/hooks/useAmenities.ts`)**
- Automatically enriches amenities with context information
- Provides fallback to base amenity data if context unavailable
- Seamlessly integrates with existing collection filtering

## 🎨 **Context Properties**

Each context includes:

```typescript
interface AmenityContext {
  collectionSlug: string;        // Which collection this context applies to
  context: string;               // Human-readable context (e.g., "Discover tropical species")
  description: string;           // Context-specific description
  emphasis: string[];            // Key points to emphasize (e.g., ["biodiversity", "tropical"])
  callToAction: string;          // Context-specific CTA (e.g., "Discover rare butterflies")
  icon: string;                  // Context-specific icon (e.g., "🦋")
  gradient: string;              // Context-specific gradient (e.g., "from-green-500 to-emerald-600")
}
```

## 🌟 **Example: Butterfly Garden**

### **Explore Collection Context**
- **Context**: "Discover tropical species"
- **Description**: "Explore one of the world's largest butterfly habitats with over 1,000 species"
- **Emphasis**: ["biodiversity", "tropical", "species diversity"]
- **Call to Action**: "Discover rare butterflies"
- **Icon**: 🦋
- **Gradient**: Green (nature/exploration theme)

### **Chill Collection Context**
- **Context**: "Peaceful nature escape"
- **Description**: "Find tranquility in this serene garden surrounded by fluttering butterflies"
- **Emphasis**: ["peaceful", "tranquil", "relaxing"]
- **Call to Action**: "Find your zen"
- **Icon**: 😌
- **Gradient**: Blue (calm/relaxation theme)

### **Changi Exclusives Context**
- **Context**: "World's largest butterfly habitat"
- **Description**: "Experience this unique Changi attraction - the largest indoor butterfly garden in the world"
- **Emphasis**: ["world record", "unique", "exclusive"]
- **Call to Action**: "Experience the record-breaker"
- **Icon**: 🏆
- **Gradient**: Purple (premium/exclusive theme)

## 🛠️ **Implementation**

### **1. Define Contexts**
```typescript
// In src/utils/amenityContexts.ts
export const AMENITY_CONTEXTS: Record<string, MultiContextAmenity> = {
  'butterfly-garden': {
    amenityId: 'butterfly-garden',
    name: 'Butterfly Garden',
    baseDescription: 'A stunning indoor garden featuring thousands of butterflies',
    contexts: [
      {
        collectionSlug: 'explore',
        context: 'Discover tropical species',
        description: 'Explore one of the world\'s largest butterfly habitats...',
        emphasis: ['biodiversity', 'tropical', 'species diversity'],
        callToAction: 'Discover rare butterflies',
        icon: '🦋',
        gradient: 'from-green-500 to-emerald-600'
      },
      // ... more contexts
    ]
  }
};
```

### **2. Use Context-Aware Component**
```typescript
import ContextAwareAmenityCard from './ContextAwareAmenityCard';

// The same amenity automatically shows different messaging per collection
<ContextAwareAmenityCard
  amenity={amenity}
  collectionSlug="explore"  // Will show "Discover tropical species" context
  onAmenityClick={handleClick}
/>

<ContextAwareAmenityCard
  amenity={amenity}
  collectionSlug="chill"     // Will show "Peaceful nature escape" context
  onAmenityClick={handleClick}
/>
```

### **3. Enhanced Hook Integration**
```typescript
import { useCollectionAmenities } from '@/hooks/useAmenities';

const { amenities } = useCollectionAmenities('SIN-T3', 'explore');

// Amenities are automatically enriched with context information
amenities.forEach(amenity => {
  console.log(amenity.contextBadge);        // "Discover tropical species"
  console.log(amenity.emphasisTags);       // ["biodiversity", "tropical", "species diversity"]
  console.log(amenity.callToAction);       // "Discover rare butterflies"
});
```

## 🔄 **Automatic Context Detection**

The system automatically:

1. **Detects** when an amenity has multiple contexts
2. **Applies** the appropriate context based on `collectionSlug`
3. **Falls back** to base amenity data if no context found
4. **Enriches** amenities with context-specific properties

## 📱 **UI Components**

### **ContextAwareAmenityCard**
- **Context Badge**: Shows the current context (e.g., "Discover tropical species")
- **Contextual Description**: Displays context-specific description
- **Emphasis Tags**: Shows key points relevant to the current context
- **Call to Action**: Context-specific button text
- **Dynamic Styling**: Uses context-specific gradients and icons

### **MultiContextAmenityDemo**
- **Side-by-side Comparison**: Shows the same amenity in different contexts
- **Visual Differences**: Demonstrates how messaging changes per collection
- **Interactive Examples**: Clickable cards for testing

## 🎯 **Benefits**

### **For Users**
- **Relevant Messaging**: Content tailored to current context
- **Different Perspectives**: Same amenity serves different needs
- **Consistent Information**: Base amenity data remains consistent
- **Personalized Experience**: Context-aware recommendations

### **For Collections**
- **Flexible Curation**: Same amenity can serve multiple purposes
- **Better Engagement**: Contextual relevance increases user interest
- **Efficient Management**: No need to duplicate amenity data
- **Dynamic Content**: Amenities adapt to collection themes

### **For Developers**
- **Clean Architecture**: Separation of concerns between data and presentation
- **Easy Maintenance**: Update context in one place
- **Type Safety**: Full TypeScript support
- **Extensible**: Easy to add new contexts and amenities

## 🧪 **Testing & Demo**

### **1. View the Demo**
```typescript
// Navigate to the MultiContextAmenityDemo component
// Shows side-by-side comparison of the same amenity in different contexts
```

### **2. Test Context Switching**
```typescript
// Change collectionSlug to see different messaging
<ContextAwareAmenityCard
  amenity={butterflyGarden}
  collectionSlug="explore"  // Try: "chill", "changi-exclusives"
/>
```

### **3. Check Console Logs**
```typescript
// Context information is automatically logged
console.log(amenity.contextInfo);        // Full context object
console.log(amenity.contextBadge);       // Current context label
console.log(amenity.emphasisTags);      // Context-specific emphasis
```

## 🚀 **Adding New Multi-Context Amenities**

### **1. Define the Amenity**
```typescript
'new-amenity': {
  amenityId: 'new-amenity',
  name: 'New Amenity Name',
  baseDescription: 'Base description for the amenity',
  contexts: [
    {
      collectionSlug: 'collection-1',
      context: 'Context for collection 1',
      description: 'Description for collection 1',
      emphasis: ['key', 'points'],
      callToAction: 'Action for collection 1',
      icon: '🎯',
      gradient: 'from-color-500 to-color-600'
    }
    // ... more contexts
  ]
}
```

### **2. Use in Components**
```typescript
<ContextAwareAmenityCard
  amenity={amenity}
  collectionSlug="collection-1"
  onAmenityClick={handleClick}
/>
```

### **3. Automatic Enhancement**
The hook automatically detects and applies the context, no additional code needed!

## 🔍 **Debugging & Troubleshooting**

### **Context Not Showing**
- Check if `collectionSlug` matches exactly
- Verify amenity has `id` field set
- Check console for context loading errors

### **Fallback Behavior**
- If no context found, base amenity data is used
- Check console for "Context system not available" messages
- Verify `amenityContexts.ts` is properly imported

### **Performance**
- Contexts are loaded on-demand
- No impact on initial amenity loading
- Fallback ensures graceful degradation

## 🎉 **Success Indicators**

- ✅ **Same amenity** appears in multiple collections
- ✅ **Different messaging** per collection context
- ✅ **Contextual badges** and descriptions
- ✅ **Dynamic styling** based on context
- ✅ **Automatic fallback** to base data
- ✅ **Seamless integration** with existing hooks

The Multi-Context Amenities system provides a powerful, flexible way to present the same amenities with contextual relevance across different collections! 🎭✨

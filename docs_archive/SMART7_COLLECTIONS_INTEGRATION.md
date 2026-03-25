# Smart7 Collections Integration Guide

This guide covers the integration of Singapore airport collections with the Smart7 system, including the SQL mapping script and React component integration.

## 🚀 **Overview**

The Smart7 system now includes a comprehensive collection of Singapore airport amenities organized by vibe and user experience. This integration ensures that Smart7 recommendations are based on well-curated, relevant collections.

## 🔧 **Collections Structure**

### **1. Comfort Collections**
- **lounges-affordable** - Budget-friendly lounge options
- **sleep-pods** - Rest and sleep facilities
- **post-red-eye-recovery** - Recovery amenities after long flights

### **2. Chill Collections**
- **hidden-quiet-spots** - Peaceful, quiet areas
- **gardens-at-dawn** - Nature and garden spaces
- **peaceful-corners** - Calm, relaxing spots

### **3. Refuel Collections**
- **local-food-real-prices** - Authentic local cuisine
- **coffee-worth-walk** - Quality coffee and cafes
- **hawker-heaven** - Hawker center food options

### **4. Work Collections**
- **work-spots-real-wifi** - Work-friendly spaces with WiFi
- **meeting-ready-spaces** - Meeting and collaboration areas
- **quiet-zones** - Quiet work environments

### **5. Quick Collections**
- **quick-bites** - Fast food options
- **gate-essentials** - Essential items near gates
- **2-minute-stops** - Very quick service options

### **6. Singapore Exclusives**
- **only-at-changi** - Unique Changi experiences
- **singapore-exclusives** - Singapore-specific brands
- **changi-exclusives** - Changi airport exclusives

## 📊 **SQL Integration**

### **1. Collection Mapping Function**

```sql
CREATE OR REPLACE FUNCTION calculate_amenity_collection_score(
  p_amenity_vibe_tags TEXT,
  p_collection_slug TEXT
) RETURNS INTEGER AS $$
BEGIN
  -- Return relevance score (0-100) for amenity to collection matching
  RETURN CASE
    -- COMFORT Collections
    WHEN p_collection_slug = 'lounges-affordable' 
      AND p_amenity_vibe_tags LIKE '%Comfort%' 
      AND p_amenity_vibe_tags LIKE '%lounge%' THEN 100
    WHEN p_collection_slug = 'lounges-affordable' 
      AND p_amenity_vibe_tags LIKE '%Comfort%' THEN 80
    
    WHEN p_collection_slug = 'sleep-pods' 
      AND p_amenity_vibe_tags LIKE '%sleep%' THEN 100
    WHEN p_collection_slug = 'sleep-pods' 
      AND p_amenity_vibe_tags LIKE '%rest%' THEN 90
    WHEN p_collection_slug = 'sleep-pods' 
      AND p_amenity_vibe_tags LIKE '%Comfort%' THEN 70
    
    -- Additional scoring logic...
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql;
```

### **2. Collection Population**

```sql
INSERT INTO collection_amenities (
  collection_id, 
  amenity_detail_id, 
  priority, 
  is_featured
)
SELECT DISTINCT ON (c.id, a.id)
  c.id as collection_id,
  a.id as amenity_detail_id,
  calculate_amenity_collection_score(a.vibe_tags, c.collection_id) as priority,
  CASE 
    WHEN calculate_amenity_collection_score(a.vibe_tags, c.collection_id) >= 95 THEN true
    ELSE false
  END as is_featured
FROM collections c
CROSS JOIN amenity_detail a
WHERE a.airport_code = 'SIN'
  AND calculate_amenity_collection_score(a.vibe_tags, c.collection_id) >= 70
  AND c.collection_id IN (
    'lounges-affordable', 'sleep-pods', 'post-red-eye-recovery',
    'hidden-quiet-spots', 'gardens-at-dawn', 'peaceful-corners',
    'local-food-real-prices', 'coffee-worth-walk', 'hawker-heaven',
    'work-spots-real-wifi', 'meeting-ready-spaces', 'quiet-zones',
    'quick-bites', 'gate-essentials', '2-minute-stops',
    'only-at-changi', 'singapore-exclusives', 'changi-exclusives'
  )
ORDER BY c.id, a.id, priority DESC;
```

### **3. Singapore Exclusives Mapping**

```sql
-- Add some manual high-value mappings for Singapore icons
INSERT INTO collection_amenities (collection_id, amenity_detail_id, priority, is_featured)
SELECT c.id, a.id, 100, true
FROM collections c, amenity_detail a
WHERE c.collection_id = 'singapore-exclusives'
  AND a.airport_code = 'SIN'
  AND (
    a.name ILIKE '%ya kun%' OR
    a.name ILIKE '%bengawan solo%' OR
    a.name ILIKE '%old chang kee%' OR
    a.name ILIKE '%tiger beer%' OR
    a.name ILIKE '%twg%' OR
    a.name ILIKE '%jewel%'
  )
ON CONFLICT DO NOTHING;
```

## 🎯 **Smart7 Integration**

### **1. Enhanced Collection Types**

```typescript
// src/types/collections.ts
export interface Smart7Collection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  vibe_category: 'comfort' | 'chill' | 'refuel' | 'work' | 'quick' | 'exclusive';
  icon: string;
  color: string;
  amenities: AmenityWithScore[];
  total_amenities: number;
  featured_amenities: number;
  avg_priority_score: number;
  terminals_covered: string[];
  is_smart7_eligible: boolean;
}

export interface AmenityWithScore {
  id: number;
  name: string;
  category: string;
  terminal_code: string;
  vibe_tags: string;
  priority_score: number;
  is_featured: boolean;
  collection_relevance: number;
}
```

### **2. Enhanced Smart7 Algorithm**

```typescript
// src/utils/smart7Algorithm.ts
export class Smart7Algorithm {
  // ... existing code ...

  private calculateCollectionScore(
    collection: Smart7Collection,
    context: Smart7Context
  ): number {
    let score = 0;
    
    // Base score from collection relevance
    score += collection.avg_priority_score * 0.3;
    
    // Vibe category matching
    const vibeMatch = this.getVibeCategoryMatch(collection.vibe_category, context);
    score += vibeMatch * 0.25;
    
    // Terminal proximity
    const terminalMatch = this.getTerminalProximity(collection.terminals_covered, context.userTerminal);
    score += terminalMatch * 0.2;
    
    // Time relevance
    const timeMatch = this.getTimeRelevance(collection.vibe_category, context.timeOfDay);
    score += timeMatch * 0.15;
    
    // User preference alignment
    const preferenceMatch = this.getPreferenceAlignment(collection, context);
    score += preferenceMatch * 0.1;
    
    return Math.min(100, score);
  }

  private getVibeCategoryMatch(
    vibeCategory: string, 
    context: Smart7Context
  ): number {
    const vibePreferences = {
      comfort: ['morning', 'night', 'long-layover'],
      chill: ['afternoon', 'evening', 'medium-layover'],
      refuel: ['morning', 'lunch', 'dinner'],
      work: ['morning', 'afternoon', 'business-travel'],
      quick: ['short-layover', 'gate-change', 'rush'],
      exclusive: ['premium', 'experience', 'leisure']
    };

    const relevantTimes = vibePreferences[vibeCategory] || [];
    return relevantTimes.some(time => 
      context.timeOfDay === time || 
      context.layoverDuration === time
    ) ? 100 : 50;
  }
}
```

### **3. Collection-Based Recommendations**

```typescript
// src/hooks/useSmart7Collections.tsx
export const useSmart7Collections = (context: Smart7Context) => {
  const [collections, setCollections] = useState<Smart7Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections/smart7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userTerminal: context.userTerminal,
            timeOfDay: context.timeOfDay,
            layoverDuration: context.layoverDuration,
            pricePreference: context.pricePreference,
            vibePreferences: context.vibePreferences
          })
        });

        const data = await response.json();
        setCollections(data.collections);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [context]);

  return { collections, loading };
};
```

### **4. Enhanced Collection Display**

```typescript
// src/components/Smart7CollectionCard.tsx
interface Smart7CollectionCardProps {
  collection: Smart7Collection;
  onSelect: (collection: Smart7Collection) => void;
  userContext: Smart7Context;
}

export const Smart7CollectionCard: React.FC<Smart7CollectionCardProps> = ({
  collection,
  onSelect,
  userContext
}) => {
  const relevanceScore = useMemo(() => {
    // Calculate relevance based on user context and collection
    return calculateCollectionRelevance(collection, userContext);
  }, [collection, userContext]);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
      onClick={() => onSelect(collection)}
    >
      {/* Collection Header */}
      <div className={`h-32 bg-gradient-to-br ${getVibeColor(collection.vibe_category)} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-3 right-3">
          <span className="text-2xl">{collection.icon}</span>
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-3xl font-bold opacity-90">{collection.total_amenities}</p>
          <p className="text-xs opacity-75">amenities</p>
        </div>
      </div>

      {/* Collection Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{collection.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getVibeBadgeColor(collection.vibe_category)}`}>
              {collection.vibe_category}
            </span>
            <span className="text-xs text-gray-500">
              {relevanceScore}% match
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{collection.description}</p>

        {/* Amenity Preview */}
        <div className="space-y-2">
          {collection.amenities.slice(0, 3).map(amenity => (
            <div key={amenity.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{amenity.name}</span>
              <div className="flex items-center space-x-2">
                {amenity.is_featured && (
                  <span className="text-yellow-500">⭐</span>
                )}
                <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(amenity.priority_score)}`}>
                  {amenity.priority_score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Collection Stats */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Terminals: {collection.terminals_covered.join(', ')}</span>
            <span>Avg Score: {collection.avg_priority_score}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
```

## 🎨 **UI Enhancements**

### **1. Vibe-Based Color System**

```typescript
const getVibeColor = (vibeCategory: string): string => {
  const colors = {
    comfort: 'from-blue-400 to-indigo-600',
    chill: 'from-green-400 to-emerald-600',
    refuel: 'from-orange-400 to-red-600',
    work: 'from-purple-400 to-pink-600',
    quick: 'from-yellow-400 to-orange-600',
    exclusive: 'from-pink-400 to-rose-600'
  };
  return colors[vibeCategory] || 'from-gray-400 to-gray-600';
};

const getVibeBadgeColor = (vibeCategory: string): string => {
  const colors = {
    comfort: 'bg-blue-100 text-blue-700',
    chill: 'bg-green-100 text-green-700',
    refuel: 'bg-orange-100 text-orange-700',
    work: 'bg-purple-100 text-purple-700',
    quick: 'bg-yellow-100 text-yellow-700',
    exclusive: 'bg-pink-100 text-pink-700'
  };
  return colors[vibeCategory] || 'bg-gray-100 text-gray-700';
};
```

### **2. Priority Score Visualization**

```typescript
const getPriorityColor = (score: number): string => {
  if (score >= 95) return 'bg-green-100 text-green-700';
  if (score >= 85) return 'bg-blue-100 text-blue-700';
  if (score >= 75) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
};
```

## 🔄 **API Integration**

### **1. Collection Endpoint**

```typescript
// src/services/collectionsApi.ts
export const collectionsApi = {
  async getSmart7Collections(context: Smart7Context): Promise<Smart7Collection[]> {
    const response = await fetch('/api/collections/smart7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch collections');
    }

    return response.json();
  },

  async getCollectionAmenities(collectionId: string): Promise<AmenityWithScore[]> {
    const response = await fetch(`/api/collections/${collectionId}/amenities`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch collection amenities');
    }

    return response.json();
  }
};
```

### **2. Smart7 Recommendations**

```typescript
// src/services/smart7Recommendations.ts
export const smart7Recommendations = {
  async getCollectionRecommendations(context: Smart7Context): Promise<Smart7Collection[]> {
    const collections = await collectionsApi.getSmart7Collections(context);
    
    // Sort by relevance score
    return collections.sort((a, b) => {
      const scoreA = calculateCollectionRelevance(a, context);
      const scoreB = calculateCollectionRelevance(b, context);
      return scoreB - scoreA;
    });
  },

  async getAmenityRecommendations(
    collectionId: string, 
    context: Smart7Context
  ): Promise<AmenityWithScore[]> {
    const amenities = await collectionsApi.getCollectionAmenities(collectionId);
    
    // Sort by priority score and user context
    return amenities.sort((a, b) => {
      const scoreA = calculateAmenityRelevance(a, context);
      const scoreB = calculateAmenityRelevance(b, context);
      return scoreB - scoreA;
    });
  }
};
```

## 📊 **Performance Optimization**

### **1. Collection Caching**

```typescript
// src/utils/collectionCache.ts
class CollectionCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const collectionCache = new CollectionCache();
```

### **2. Lazy Loading Collections**

```typescript
// src/hooks/useLazyCollections.tsx
export const useLazyCollections = (context: Smart7Context) => {
  const [collections, setCollections] = useState<Smart7Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newCollections = await collectionsApi.getSmart7Collections(context, page);
      setCollections(prev => [...prev, ...newCollections]);
      setHasMore(newCollections.length > 0);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  }, [context, page, loading, hasMore]);

  return { collections, loading, hasMore, loadMore };
};
```

## 🚀 **Implementation Steps**

### **1. Database Setup**
```bash
# Run the SQL script
psql -d your_database -f complete_sin_collections_mapping.sql
```

### **2. API Endpoints**
```bash
# Create the necessary API endpoints
# - GET /api/collections/smart7
# - GET /api/collections/:id/amenities
# - POST /api/collections/recommendations
```

### **3. React Integration**
```bash
# Update your Smart7 components
# - Enhanced collection types
# - Vibe-based UI components
# - Priority score visualization
# - Collection caching
```

### **4. Testing**
```bash
# Test the integration
# - Collection loading
# - Amenity recommendations
# - Priority scoring
# - UI responsiveness
```

## 🔮 **Future Enhancements**

### **Planned Features**
- **Real-time Collection Updates** - Live collection modifications
- **User Collection Preferences** - Personalized collection rankings
- **Collection Analytics** - Performance metrics and insights
- **Dynamic Collection Creation** - AI-generated collections

### **Integration Opportunities**
- **Machine Learning** - Enhanced recommendation algorithms
- **Social Features** - User-generated collections
- **Gamification** - Collection completion rewards
- **Predictive Analytics** - Future collection trends

---

The Smart7 collections integration provides a comprehensive and intelligent system for organizing and recommending airport amenities. With vibe-based categorization, priority scoring, and user context awareness, it ensures that Smart7 recommendations are always relevant and valuable.

## 📚 **Integration Benefits**

- **Intelligent Organization** - Vibe-based collection categorization
- **Priority Scoring** - Amenities ranked by relevance
- **User Context Awareness** - Personalized recommendations
- **Performance Optimization** - Caching and lazy loading
- **Scalable Architecture** - Easy to extend and customize
- **Singapore-Specific** - Local expertise and exclusives

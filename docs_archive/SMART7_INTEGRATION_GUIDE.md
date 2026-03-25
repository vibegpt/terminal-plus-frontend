# Smart7 + Tracking System Integration Guide

This guide explains how to integrate the Smart7 AI recommendation system with the comprehensive tracking system for optimal user experience and analytics.

## 🎯 **System Overview**

The Smart7 system provides AI-powered amenity recommendations based on:
- **Time relevance** - Current time vs. amenity hours
- **Proximity** - User's terminal location
- **User preferences** - Past interactions and behavior
- **Diversity** - Balanced selection across categories

All selections are automatically tracked for analytics and continuous improvement.

## 🔗 **Integration Points**

### 1. **Tracking Integration**
The Smart7 system automatically integrates with the tracking system:

```tsx
// Smart7 selections are automatically tracked
const { selections } = useSmart7Selection({
  collectionId: 123,
  config: {
    enableTracking: true, // Default: true
    diversityRules: {
      maxSameTerminal: 3,
      maxSamePriceLevel: 3,
      balanceCategories: true
    }
  }
});

// Each selection is tracked with context
// - Amenity ID
// - Collection ID  
// - Position in list
// - Selection reason
// - Algorithm context
```

### 2. **Session Context Integration**
Smart7 uses the session tracker for user context:

```tsx
// Terminal preference is automatically used
const { updateContext } = useSmart7Selection({ collectionId: 123 });

// Update user terminal
updateContext({ userTerminal: 'T2' });

// Update price preference
updateContext({ pricePreference: '$$' });

// Update layover duration
updateContext({ layoverDuration: 120 }); // 2 hours
```

## 🚀 **Quick Start Implementation**

### 1. **Basic Smart7 Collection View**

```tsx
import { useSmart7Selection } from '../hooks/useSmart7Selection';
import { AmenityCard } from '../components/AmenityCard';

const Smart7Collection = ({ collectionId }: { collectionId: number }) => {
  const {
    selections,
    isLoading,
    error,
    refresh,
    totalAmenities,
    lastRefreshed
  } = useSmart7Selection({
    collectionId,
    autoRefresh: true,
    refreshInterval: 30 // Refresh every 30 minutes
  });

  if (isLoading) return <div>Loading Smart7 selections...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Smart7 Picks</h2>
      <p>Selected from {totalAmenities} total options</p>
      
      {selections.map((selection) => (
        <AmenityCard
          key={selection.amenity.id}
          amenity={selection.amenity}
          collectionId={collectionId}
          position={selection.rank}
          isSmart7Selection={true}
          contextReason={selection.selectionReason}
        />
      ))}
      
      <button onClick={refresh}>Refresh Selections</button>
    </div>
  );
};
```

### 2. **Personalized Smart7 with User Context**

```tsx
const PersonalizedSmart7 = ({ collectionId }: { collectionId: number }) => {
  const [userTerminal, setUserTerminal] = useState('T1');
  const [pricePreference, setPricePreference] = useState<string>();
  
  const { selections, updateContext } = useSmart7Selection({
    collectionId,
    overrideContext: {
      userTerminal,
      pricePreference: pricePreference as any
    }
  });

  // Update context when user changes preferences
  const handleTerminalChange = (terminal: string) => {
    setUserTerminal(terminal);
    updateContext({ userTerminal: terminal });
  };

  const handlePriceChange = (price: string) => {
    setPricePreference(price);
    updateContext({ pricePreference: price as any });
  };

  return (
    <div>
      {/* User Preference Controls */}
      <div>
        <label>Your Terminal:</label>
        <select value={userTerminal} onChange={(e) => handleTerminalChange(e.target.value)}>
          <option value="T1">Terminal 1</option>
          <option value="T2">Terminal 2</option>
          <option value="T3">Terminal 3</option>
          <option value="T4">Terminal 4</option>
          <option value="Jewel">Jewel</option>
        </select>
        
        <label>Price Preference:</label>
        <select value={pricePreference || ''} onChange={(e) => handlePriceChange(e.target.value)}>
          <option value="">Any price</option>
          <option value="$">Budget ($)</option>
          <option value="$$">Mid-range ($$)</option>
          <option value="$$$">Premium ($$$)</option>
        </select>
      </div>

      {/* Smart7 Selections */}
      <div>
        {selections.map((selection) => (
          <AmenityCard
            key={selection.amenity.id}
            amenity={selection.amenity}
            collectionId={collectionId}
            position={selection.rank}
            isSmart7Selection={true}
            contextReason={selection.selectionReason}
          />
        ))}
      </div>
    </div>
  );
};
```

## 📊 **Analytics & Performance Tracking**

### 1. **Smart7 Performance Metrics**

```tsx
import { useSmart7Performance } from '../hooks/useSmart7Selection';

const Smart7Analytics = ({ collectionId }: { collectionId: number }) => {
  const stats = useSmart7Performance(collectionId);

  if (!stats) return <div>Loading analytics...</div>;

  return (
    <div>
      <h3>Smart7 Performance</h3>
      <div>
        <p>Click-through Rate: {(stats.clickThroughRate * 100).toFixed(1)}%</p>
        <p>Average Position Clicked: #{stats.avgPositionClicked.toFixed(1)}</p>
        <p>Selection Effectiveness: {(stats.selectionEffectiveness * 100).toFixed(0)}%</p>
        <p>Top Performing Positions: {stats.topPerformingPositions.map(p => `#${p}`).join(', ')}</p>
      </div>
    </div>
  );
};
```

### 2. **User Preference Analysis**

```tsx
const UserInsights = ({ collectionId }: { collectionId: number }) => {
  const { preferences } = useSmart7Selection({ collectionId });

  if (!preferences) return <div>No preference data available</div>;

  return (
    <div>
      <h3>Your Preferences</h3>
      <div>
        <p>Top Vibes: {preferences.preferredVibes.join(', ')}</p>
        <p>Price Levels: {preferences.preferredPriceLevels.join(', ')}</p>
        <p>Engagement Pattern: {preferences.engagementPattern}</p>
        <p>Frequently Clicked: {preferences.clickedAmenityIds.length} amenities</p>
      </div>
    </div>
  );
};
```

## ⚙️ **Configuration Options**

### 1. **Algorithm Configuration**

```tsx
const customConfig = {
  targetCount: 5, // Show 5 instead of 7
  weights: {
    timeRelevance: 0.4,    // Increase time importance
    proximity: 0.3,         // Increase proximity importance
    preference: 0.2,        // Decrease preference importance
    diversity: 0.1          // Decrease diversity importance
  },
  diversityRules: {
    maxSameTerminal: 2,     // Max 2 from same terminal
    maxSamePriceLevel: 2,   // Max 2 with same price
    maxSameCategory: 1,     // Max 1 from same category
    balanceCategories: true // Balance across categories
  },
  includeReasons: true,     // Generate selection reasons
  fallbackStrategy: 'popular' // Use popular amenities as fallback
};
```

### 2. **Time-Based Configuration**

```tsx
// Custom time relevance for different use cases
const customTimeConfig = {
  breakfastHours: { start: 5, end: 12 },   // Extended breakfast
  lunchHours: { start: 11, end: 15 },      // Extended lunch
  dinnerHours: { start: 17, end: 23 },     // Extended dinner
  lateNightHours: { start: 23, end: 5 }    // Late night options
};
```

## 🔄 **Auto-Refresh & Real-time Updates**

### 1. **Automatic Refresh**

```tsx
const { selections, lastRefreshed } = useSmart7Selection({
  collectionId,
  autoRefresh: true,
  refreshInterval: 15 // Refresh every 15 minutes
});

// Display last refresh time
<p>Last updated: {lastRefreshed?.toLocaleTimeString()}</p>
```

### 2. **Manual Refresh with Context Updates**

```tsx
const { refresh, updateContext } = useSmart7Selection({ collectionId });

const handleRefresh = async () => {
  // Update context before refresh
  updateContext({
    userTerminal: currentTerminal,
    pricePreference: currentPrice,
    layoverDuration: currentLayover
  });
  
  // Refresh selections
  await refresh();
};
```

## 🎨 **UI Integration Examples**

### 1. **Smart7 Badge Component**

```tsx
const Smart7Badge = ({ rank, reason }: { rank: number; reason: string }) => (
  <div className="smart7-badge">
    <span className="rank">#{rank}</span>
    <span className="reason">{reason}</span>
  </div>
);
```

### 2. **Selection Reason Display**

```tsx
const SelectionReason = ({ reason, score }: { reason: string; score: ScoringFactors }) => (
  <div className="selection-reason">
    <p className="reason-text">{reason}</p>
    <div className="score-breakdown">
      <span>Time: {(score.timeScore * 100).toFixed(0)}%</span>
      <span>Proximity: {(score.proximityScore * 100).toFixed(0)}%</span>
      <span>Preference: {(score.preferenceScore * 100).toFixed(0)}%</span>
    </div>
  </div>
);
```

## 📱 **Mobile & Responsive Considerations**

### 1. **Touch-Friendly Controls**

```tsx
const MobileFriendlyControls = ({ onTerminalChange, onPriceChange }) => (
  <div className="mobile-controls">
    <div className="terminal-selector">
      {['T1', 'T2', 'T3', 'T4', 'Jewel'].map(terminal => (
        <button
          key={terminal}
          className="terminal-btn"
          onClick={() => onTerminalChange(terminal)}
        >
          {terminal}
        </button>
      ))}
    </div>
    
    <div className="price-selector">
      {['$', '$$', '$$$'].map(price => (
        <button
          key={price}
          className="price-btn"
          onClick={() => onPriceChange(price)}
        >
          {price}
        </button>
      ))}
    </div>
  </div>
);
```

### 2. **Responsive Layout**

```tsx
const ResponsiveSmart7Layout = ({ selections }) => (
  <div className="smart7-layout">
    <div className="smart7-grid">
      {selections.map((selection) => (
        <div key={selection.amenity.id} className="smart7-item">
          <AmenityCard
            amenity={selection.amenity}
            isSmart7Selection={true}
            contextReason={selection.selectionReason}
          />
          <Smart7Badge rank={selection.rank} reason={selection.selectionReason} />
        </div>
      ))}
    </div>
  </div>
);
```

## 🧪 **Testing & Debugging**

### 1. **Debug Mode**

```tsx
// Enable debug logging
localStorage.setItem('smart7_debug', 'true');

// Check algorithm version
const { algorithmVersion } = useSmart7Selection({ collectionId });
console.log('Smart7 Algorithm Version:', algorithmVersion);
```

### 2. **Performance Monitoring**

```tsx
const PerformanceMonitor = ({ collectionId }) => {
  const startTime = useRef(Date.now());
  const { selections, isLoading } = useSmart7Selection({ collectionId });

  useEffect(() => {
    if (!isLoading && selections.length > 0) {
      const loadTime = Date.now() - startTime.current;
      console.log(`Smart7 loaded in ${loadTime}ms`);
      
      // Track performance
      sessionTracker.trackInteraction(collectionId, 'view', {
        context_data: { load_time_ms: loadTime, selection_count: selections.length }
      });
    }
  }, [selections, isLoading, collectionId]);

  return null;
};
```

## 🚨 **Error Handling & Fallbacks**

### 1. **Graceful Degradation**

```tsx
const Smart7WithFallback = ({ collectionId }) => {
  const { selections, error, isLoading } = useSmart7Selection({ collectionId });

  if (error) {
    return (
      <div className="error-fallback">
        <p>Smart7 selection failed: {error}</p>
        <p>Showing popular amenities instead...</p>
        <PopularAmenities collectionId={collectionId} />
      </div>
    );
  }

  return <Smart7Selections selections={selections} />;
};
```

### 2. **Loading States**

```tsx
const Smart7LoadingStates = ({ collectionId }) => {
  const { selections, isLoading, error } = useSmart7Selection({ collectionId });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Personalizing your Smart7 selections...</p>
        <p>This may take a few seconds</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return <Smart7Selections selections={selections} />;
};
```

## 🔮 **Future Enhancements**

### 1. **A/B Testing Framework**

```tsx
// Future implementation
const { selections, variant } = useSmart7Selection({
  collectionId,
  config: {
    enableABTesting: true,
    testVariants: ['control', 'time_heavy', 'proximity_heavy']
  }
});
```

### 2. **Machine Learning Insights**

```tsx
// Future implementation
const { insights } = useSmart7Insights({ collectionId });

// Display ML-powered insights
<div className="ml-insights">
  <p>Based on similar users, you might also like:</p>
  <p>Trending in your terminal: {insights.trendingAmenities.join(', ')}</p>
  <p>Peak time recommendation: {insights.peakTimeRecommendation}</p>
</div>
```

## 📚 **Best Practices**

1. **Always enable tracking** - Data drives algorithm improvement
2. **Use appropriate refresh intervals** - Balance freshness with performance
3. **Handle loading states gracefully** - Provide good user experience
4. **Implement fallbacks** - Ensure system works even when Smart7 fails
5. **Monitor performance** - Track load times and user engagement
6. **Test with real data** - Validate algorithm with actual user behavior
7. **Iterate based on analytics** - Use performance data to improve selection

## 🔧 **Troubleshooting**

### Common Issues:

1. **Selections not updating**
   - Check if `autoRefresh` is enabled
   - Verify `refreshInterval` is set correctly
   - Ensure context changes trigger refresh

2. **Performance issues**
   - Reduce refresh frequency
   - Implement caching
   - Monitor database query performance

3. **Tracking not working**
   - Verify `enableTracking` is true
   - Check session tracker initialization
   - Ensure Supabase is configured

4. **Algorithm errors**
   - Check console for error logs
   - Verify amenity data structure
   - Ensure all required fields are present

---

This integration guide provides everything needed to implement Smart7 with full tracking integration. The system automatically improves over time as it learns from user behavior and preferences.

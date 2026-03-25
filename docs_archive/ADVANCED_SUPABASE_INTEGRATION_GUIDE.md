# Advanced Supabase Integration Guide

This guide covers the comprehensive integration of advanced Supabase services with the Smart7 system, including real-time updates, query optimization, and advanced data management.

## 🚀 **System Architecture Overview**

The advanced Supabase integration consists of:

1. **Enhanced Data Service** - Advanced collection management with insights and analytics
2. **Real-time Service** - Live updates and performance monitoring
3. **Query Optimizer** - Intelligent caching, deduplication, and performance optimization
4. **Advanced Hooks** - Comprehensive data fetching with real-time support

## 🔧 **Core Services Integration**

### **1. Enhanced Data Service (`supabaseDataService`)**

The enhanced data service provides advanced collection management with:

- **Smart7 Eligibility Filtering** - Automatic filtering for collections with 7-21 amenities
- **Popularity Scoring** - Weighted scoring based on user interactions
- **Multi-terminal Access** - Support for amenities accessible from multiple terminals
- **Personalized Recommendations** - AI-powered collection suggestions
- **Performance Insights** - Detailed analytics and trending data

#### **Basic Usage**

```tsx
import { supabaseDataService } from '../services/supabaseDataService';

// Get Smart7 eligible collections with popularity scores
const collections = await supabaseDataService.getSmart7CollectionsWithStats({
  includePopularity: true,
  sortBy: 'popularity',
  limit: 10
});

// Get personalized recommendations
const sessionId = sessionTracker.getSessionId();
if (sessionId) {
  const personalized = await supabaseDataService.getPersonalizedCollections(
    sessionId,
    { 
      limit: 5,
      excludeViewed: true,
      timeOfDay: 'afternoon'
    }
  );
}
```

#### **Advanced Features**

```tsx
// Get collection insights
const insights = await supabaseDataService.getCollectionInsights(collectionId, {
  start: new Date('2024-01-01'),
  end: new Date()
});

// Get multi-terminal amenities
const multiTerminalAmenities = await supabaseDataService.getAmenitiesWithTerminalAccess(collectionId);

// Get trending amenities
const trending = await supabaseDataService.getTrendingAmenities({
  limit: 10,
  timeWindow: 'week',
  terminal: 'T1'
});

// Track Smart7 performance
await supabaseDataService.trackSmart7Performance(sessionId, collectionId, {
  loadTime: 250,
  fromCache: true,
  selectionsCount: 7,
  algorithmTime: 45,
  totalAmenities: 150,
  deviceType: 'mobile',
  networkType: '4G'
});
```

### **2. Real-time Service (`supabaseRealtimeService`)**

The real-time service provides live updates and performance monitoring:

- **Collection Updates** - Real-time notifications when collections change
- **Live Metrics** - Active users, trending content, and performance data
- **Smart7 Updates** - Live algorithm improvements and selection updates
- **Amenity Availability** - Real-time status changes

#### **Real-time Subscriptions**

```tsx
import { supabaseRealtimeService } from '../services/supabaseRealtimeService';

// Subscribe to collection updates
const unsubscribe = supabaseRealtimeService.subscribeToCollection(
  collectionId,
  (update) => {
    console.log('Collection update:', update);
    
    switch (update.update_type) {
      case 'amenity_added':
        // Refresh amenities list
        refreshAmenities();
        break;
      case 'amenity_removed':
        // Remove from UI
        removeAmenity(update.amenity_id);
        break;
      case 'collection_updated':
        // Update collection metadata
        updateCollectionInfo(update.data);
        break;
    }
  }
);

// Subscribe to live metrics
const metricsUnsubscribe = supabaseRealtimeService.subscribeToLiveMetrics(
  (metrics) => {
    setLiveMetrics({
      activeUsers: metrics.active_users,
      trendingCollections: metrics.popular_collections,
      trendingAmenities: metrics.trending_amenities,
      avgLoadTime: metrics.avg_load_time,
      errorRate: metrics.error_rate
    });
  },
  30000 // Update every 30 seconds
);

// Subscribe to Smart7 updates
const smart7Unsubscribe = supabaseRealtimeService.subscribeToSmart7Updates(
  collectionId,
  sessionId,
  (newSelections) => {
    // Update selections when algorithm improves
    setSelections(newSelections);
    showNotification('Smart7 selections updated!');
  }
);

// Subscribe to amenity availability
const availabilityUnsubscribe = supabaseRealtimeService.subscribeToAmenityAvailability(
  amenityIds,
  (amenityId, isAvailable) => {
    updateAmenityAvailability(amenityId, isAvailable);
  }
);

// Cleanup on unmount
useEffect(() => {
  return () => {
    unsubscribe();
    metricsUnsubscribe();
    smart7Unsubscribe();
    availabilityUnsubscribe();
  };
}, []);
```

### **3. Query Optimizer (`queryOptimizer`)**

The query optimizer provides intelligent query management:

- **Automatic Caching** - Smart caching with TTL management
- **Query Deduplication** - Prevents duplicate identical queries
- **Batch Operations** - Efficient handling of multiple queries
- **Performance Monitoring** - Query metrics and optimization insights

#### **Optimized Queries**

```tsx
import { queryOptimizer } from '../utils/supabaseQueryOptimizer';

// Basic optimized query
const { data: amenities, metrics } = await queryOptimizer.optimizedQuery(
  'collection_amenities',
  {
    select: 'amenity_detail(*)',
    filters: { collection_id: collectionId },
    orderBy: [{ column: 'priority', ascending: true }],
    limit: 20,
    cache: true,
    cacheTTL: 5 * 60 * 1000 // 5 minutes
  }
);

// Paginated query with cursor
const { data, nextCursor, hasMore } = await queryOptimizer.paginatedQuery(
  'amenity_detail',
  {
    filters: { terminal_code: 'T1' },
    cursorColumn: 'id',
    orderBy: [{ column: 'name' }],
    cache: true
  },
  {
    page: 1,
    pageSize: 20,
    cursor: currentCursor
  }
);

// Batch query for multiple IDs
const { data: batchData } = await queryOptimizer.batchQuery(
  'amenity_detail',
  amenityIds,
  {
    idColumn: 'id',
    select: 'id, name, description, terminal_code',
    chunkSize: 100,
    cache: true
  }
);

// Parallel queries
const results = await queryOptimizer.parallelQueries([
  {
    key: 'collections',
    table: 'collections',
    options: { select: '*', limit: 10 }
  },
  {
    key: 'amenities',
    table: 'amenity_detail',
    options: { select: 'id, name', limit: 50 }
  },
  {
    key: 'interactions',
    table: 'amenity_interactions',
    options: { 
      select: 'amenity_id, interaction_type',
      filters: { session_id: sessionId }
    }
  }
]);

// Intelligent prefetching
await queryOptimizer.intelligentPrefetch(sessionId, currentCollectionId);
```

#### **Performance Monitoring**

```tsx
// Get query performance statistics
const stats = queryOptimizer.getQueryStats();

console.log('Query Performance:', {
  averageQueryTime: `${stats.avgQueryTime}ms`,
  cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
  totalQueries: stats.totalQueries,
  slowQueries: stats.slowQueries
});

// Clear cache when needed
queryOptimizer.clearCache();
```

## 📱 **Advanced Hooks Integration**

### **1. Collections Hook (`useSupabaseCollections`)**

```tsx
import { useSupabaseCollections } from '../hooks/useSupabaseData';

const CollectionsComponent = () => {
  const {
    collections,
    personalizedCollections,
    isLoading,
    error,
    refresh,
    metrics
  } = useSupabaseCollections({
    sortBy: 'popularity',
    limit: 20,
    includePersonalized: true,
    enableRealtime: true
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Live metrics */}
      <div className="live-metrics">
        <span>👥 {metrics.active_users} active users</span>
        <span>🔥 {metrics.trending_collections.length} trending collections</span>
      </div>

      {/* Personalized collections */}
      {personalizedCollections.length > 0 && (
        <section>
          <h3>Recommended for You</h3>
          <CollectionsGrid collections={personalizedCollections} />
        </section>
      )}

      {/* All collections */}
      <section>
        <h3>All Collections</h3>
        <CollectionsGrid collections={collections} />
      </section>

      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

### **2. Amenities Hook (`useSupabaseAmenities`)**

```tsx
import { useSupabaseAmenities } from '../hooks/useSupabaseData';

const AmenitiesComponent = ({ collectionId }: { collectionId: number }) => {
  const {
    amenities,
    multiTerminalAmenities,
    isLoading,
    error,
    refresh,
    collectionInfo,
    insights
  } = useSupabaseAmenities({
    collectionId,
    includeMultiTerminal: true,
    enableRealtime: true,
    prefetchRelated: true
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Collection info */}
      {collectionInfo && (
        <CollectionHeader info={collectionInfo} />
      )}

      {/* Performance insights */}
      {insights && (
        <InsightsPanel insights={insights} />
      )}

      {/* Multi-terminal amenities */}
      {multiTerminalAmenities.length > 0 && (
        <section>
          <h3>Multi-Terminal Access</h3>
          <AmenitiesGrid amenities={multiTerminalAmenities} />
        </section>
      )}

      {/* All amenities */}
      <section>
        <h3>All Amenities</h3>
        <AmenitiesGrid amenities={amenities} />
      </section>

      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

### **3. Trending Data Hook (`useTrendingData`)**

```tsx
import { useTrendingData } from '../hooks/useSupabaseData';

const TrendingComponent = ({ terminal }: { terminal?: string }) => {
  const {
    trendingAmenities,
    trendingCollections,
    isLoading,
    timeWindow,
    setTimeWindow,
    refresh
  } = useTrendingData(terminal);

  return (
    <div>
      {/* Time window selector */}
      <div className="time-selector">
        {(['day', 'week', 'month'] as const).map(window => (
          <button
            key={window}
            className={timeWindow === window ? 'active' : ''}
            onClick={() => setTimeWindow(window)}
          >
            {window.charAt(0).toUpperCase() + window.slice(1)}
          </button>
        ))}
      </div>

      {/* Trending amenities */}
      <section>
        <h3>Trending Amenities</h3>
        <AmenitiesGrid amenities={trendingAmenities} />
      </section>

      {/* Trending collections */}
      <section>
        <h3>Trending Collections</h3>
        <CollectionsGrid collections={trendingCollections} />
      </section>

      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

### **4. Paginated Amenities Hook (`usePaginatedAmenities`)**

```tsx
import { usePaginatedAmenities } from '../hooks/useSupabaseData';

const PaginatedAmenitiesComponent = () => {
  const {
    amenities,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    totalLoaded
  } = usePaginatedAmenities({
    filters: { terminal_code: 'T1' },
    pageSize: 20,
    sortBy: 'name'
  });

  return (
    <div>
      <div className="amenities-header">
        <h3>Amenities ({totalLoaded})</h3>
        <button onClick={reset}>Reset</button>
      </div>

      <AmenitiesGrid amenities={amenities} />

      {hasMore && (
        <button 
          onClick={loadMore}
          disabled={isLoading}
          className="load-more-btn"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {error && <ErrorMessage error={error} />}
    </div>
  );
};
```

### **5. Query Performance Hook (`useQueryPerformance`)**

```tsx
import { useQueryPerformance } from '../hooks/useSupabaseData';

const PerformanceMonitor = () => {
  const {
    avgQueryTime,
    cacheHitRate,
    totalQueries,
    slowQueries,
    clearCache
  } = useQueryPerformance();

  return (
    <div className="performance-monitor">
      <h3>Query Performance</h3>
      
      <div className="metrics-grid">
        <div className="metric">
          <span className="label">Average Query Time</span>
          <span className="value">{avgQueryTime}ms</span>
        </div>
        
        <div className="metric">
          <span className="label">Cache Hit Rate</span>
          <span className="value">{(cacheHitRate * 100).toFixed(1)}%</span>
        </div>
        
        <div className="metric">
          <span className="label">Total Queries</span>
          <span className="value">{totalQueries}</span>
        </div>
        
        <div className="metric">
          <span className="label">Slow Queries</span>
          <span className="value">{slowQueries}</span>
        </div>
      </div>

      <button onClick={clearCache} className="clear-cache-btn">
        Clear Cache
      </button>
    </div>
  );
};
```

## 🔄 **Real-time Integration Patterns**

### **1. Live Updates Pattern**

```tsx
const LiveUpdatesComponent = ({ collectionId }: { collectionId: number }) => {
  const [isLive, setIsLive] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!isLive) return;

    const unsubscribe = supabaseRealtimeService.subscribeToCollection(
      collectionId,
      (update) => {
        setUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10
        
        // Show notification
        showNotification(`${update.update_type} detected`, 'info');
        
        // Auto-refresh if significant change
        if (update.update_type === 'amenity_added' || update.update_type === 'amenity_removed') {
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    );

    return unsubscribe;
  }, [collectionId, isLive]);

  return (
    <div>
      <div className="live-controls">
        <label>
          <input
            type="checkbox"
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
          />
          Enable Live Updates
        </label>
      </div>

      {isLive && (
        <div className="live-updates">
          <h4>Live Updates</h4>
          {updates.map((update, index) => (
            <div key={index} className="update-item">
              <span className="update-type">{update.update_type}</span>
              <span className="update-time">
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **2. Performance Monitoring Pattern**

```tsx
const PerformanceMonitoringComponent = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = supabaseRealtimeService.subscribeToLiveMetrics(
      (liveMetrics) => {
        setMetrics(liveMetrics);

        // Performance alerts
        if (liveMetrics.avg_load_time > 1000) {
          setAlerts(prev => [...prev, 'High load time detected']);
        }

        if (liveMetrics.error_rate > 0.05) {
          setAlerts(prev => [...prev, 'High error rate detected']);
        }

        // Auto-clear old alerts
        setTimeout(() => {
          setAlerts(prev => prev.slice(1));
        }, 10000);
      },
      15000 // Update every 15 seconds
    );

    return unsubscribe;
  }, []);

  return (
    <div className="performance-monitoring">
      <h3>Live Performance Monitoring</h3>
      
      {metrics && (
        <div className="metrics-display">
          <div className="metric">
            <span>Active Users: {metrics.active_users}</span>
          </div>
          <div className="metric">
            <span>Avg Load Time: {metrics.avg_load_time}ms</span>
          </div>
          <div className="metric">
            <span>Error Rate: {(metrics.error_rate * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map((alert, index) => (
            <div key={index} className="alert">
              ⚠️ {alert}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🚨 **Error Handling & Recovery**

### **1. Graceful Degradation**

```tsx
const ResilientDataComponent = ({ collectionId }: { collectionId: number }) => {
  const [data, setData] = useState<any>(null);
  const [fallbackData, setFallbackData] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = async () => {
    try {
      // Try primary data source
      const result = await supabaseDataService.getCollectionDetails(collectionId);
      setData(result);
      setFallbackData(result); // Store for offline use
    } catch (error) {
      console.error('Primary data fetch failed:', error);
      
      // Try fallback
      if (fallbackData) {
        setData(fallbackData);
        showNotification('Using cached data', 'warning');
      } else {
        // Show offline message
        setIsOffline(true);
      }
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchData(); // Retry when back online
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="offline-message">
        <p>📱 You're offline. Some features may be limited.</p>
        {fallbackData && (
          <button onClick={() => setData(fallbackData)}>
            Use Cached Data
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {data ? (
        <DataDisplay data={data} />
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
```

### **2. Circuit Breaker Pattern**

```tsx
const CircuitBreakerComponent = () => {
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const executeWithCircuitBreaker = async (operation: () => Promise<any>) => {
    if (isCircuitOpen) {
      throw new Error('Circuit breaker is open - too many failures');
    }

    try {
      const result = await operation();
      setErrorCount(0); // Reset on success
      return result;
    } catch (error) {
      setErrorCount(prev => prev + 1);
      
      // Open circuit after 5 failures
      if (errorCount >= 4) {
        setIsCircuitOpen(true);
        setTimeout(() => {
          setIsCircuitOpen(false);
          setErrorCount(0);
        }, 60000); // Close after 1 minute
      }
      
      throw error;
    }
  };

  const fetchData = () => executeWithCircuitBreaker(async () => {
    return await supabaseDataService.getCollectionDetails(collectionId);
  });

  return (
    <div>
      {isCircuitOpen && (
        <div className="circuit-breaker-alert">
          ⚠️ Service temporarily unavailable. Retrying in 1 minute...
        </div>
      )}
      
      <button onClick={fetchData} disabled={isCircuitOpen}>
        Fetch Data
      </button>
    </div>
  );
};
```

## 📊 **Performance Optimization Strategies**

### **1. Intelligent Prefetching**

```tsx
const PrefetchingComponent = ({ collectionId }: { collectionId: number }) => {
  useEffect(() => {
    // Prefetch related collections
    const prefetchRelated = async () => {
      try {
        const related = await supabaseDataService.getSimilarCollections(collectionId, 3);
        
        // Prefetch amenities for related collections
        for (const collection of related) {
          queryOptimizer.intelligentPrefetch(
            sessionTracker.getSessionId() || '',
            collection.id
          );
        }
      } catch (error) {
        console.error('Prefetch failed:', error);
      }
    };

    // Delay prefetch to avoid blocking initial load
    const timer = setTimeout(prefetchRelated, 2000);
    return () => clearTimeout(timer);
  }, [collectionId]);

  return <div>Content with intelligent prefetching</div>;
};
```

### **2. Adaptive Caching**

```tsx
const AdaptiveCachingComponent = () => {
  const [cacheStrategy, setCacheStrategy] = useState<'aggressive' | 'balanced' | 'minimal'>('balanced');

  useEffect(() => {
    // Detect connection quality and adjust caching
    const connection = (navigator as any).connection;
    
    if (connection?.effectiveType === '2g' || connection?.saveData) {
      setCacheStrategy('aggressive');
    } else if (connection?.effectiveType === '4g') {
      setCacheStrategy('balanced');
    } else {
      setCacheStrategy('minimal');
    }
  }, []);

  const getCacheConfig = () => {
    switch (cacheStrategy) {
      case 'aggressive':
        return { ttl: 30 * 60 * 1000, maxSize: 50 }; // 30 min, 50MB
      case 'balanced':
        return { ttl: 5 * 60 * 1000, maxSize: 20 }; // 5 min, 20MB
      case 'minimal':
        return { ttl: 1 * 60 * 1000, maxSize: 10 }; // 1 min, 10MB
    }
  };

  return (
    <div>
      <div className="cache-strategy">
        Cache Strategy: {cacheStrategy}
      </div>
      {/* Use cache config in queries */}
    </div>
  );
};
```

## 🔮 **Future Enhancements**

### **Planned Features**
- **Machine Learning Query Optimization** - Predict optimal query patterns
- **Real-time Analytics Dashboard** - Live performance insights
- **Advanced Caching Strategies** - Predictive and adaptive caching
- **Distributed Query Processing** - Handle complex queries across multiple services

### **Integration Opportunities**
- **Service Worker Integration** - Advanced offline capabilities
- **WebSocket Fallbacks** - Alternative real-time channels
- **Edge Computing** - Global performance optimization
- **AI-Powered Insights** - Automated performance recommendations

---

This advanced Supabase integration provides enterprise-grade data management, real-time capabilities, and performance optimization for the Smart7 system. The combination of intelligent caching, real-time updates, and query optimization ensures optimal performance across all network conditions and device types.

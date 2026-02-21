# ContextControls Integration Guide

This guide covers the comprehensive integration of the ContextControls component with the Smart7 system, providing intuitive user preference management and context-aware recommendations.

## 🚀 **Component Overview**

The ContextControls component provides:

- **Terminal Selection** - Choose from available terminals
- **Price Preferences** - Budget, mid, premium, or any
- **Time of Day** - Morning, afternoon, evening, night, or auto
- **Meal Type** - Breakfast, lunch, dinner, snack, or any
- **Walking Speed** - Slow, normal, or fast
- **Advanced Options** - Layover duration and accessibility
- **Auto-context Detection** - Intelligent preference detection
- **Multiple Display Modes** - Compact, floating, and inline

## 🔧 **Core Features**

### **1. Smart Context Management**

The component automatically manages user context and integrates with the Smart7 system:

```tsx
interface Smart7Context {
  userTerminal?: string;
  pricePreference?: 'budget' | 'mid' | 'premium' | 'any';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'auto';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  walkingSpeed?: 'slow' | 'normal' | 'fast';
  layoverDuration?: 'short' | 'medium' | 'long';
  accessibility?: 'standard' | 'wheelchair' | 'reduced-mobility';
}
```

### **2. Auto-context Detection**

Intelligent detection of user preferences based on:
- **Current time** - Automatically detects time of day and meal preferences
- **User behavior** - Learns from previous interactions and preferences
- **Session data** - Integrates with tracking system for personalized defaults

### **3. Performance Optimization**

- **Debounced updates** - Prevents excessive API calls during rapid changes
- **Smart caching** - Integrates with performance optimizer
- **Efficient re-renders** - Optimized state management with useCallback

## 📱 **Display Modes**

### **1. Compact Mode**

```tsx
<ContextControls
  compact={true}
  onContextChange={handleContextChange}
  currentContext={userContext}
  availableTerminals={['T1', 'T2', 'T3', 'T4']}
/>
```

**Features:**
- Minimal space usage
- Essential controls only
- Perfect for mobile or space-constrained layouts
- Auto-detect button included

### **2. Floating Mode**

```tsx
<ContextControls
  floating={true}
  onContextChange={handleContextChange}
  currentContext={userContext}
  enableAutoContext={true}
/>
```

**Features:**
- Floating action button
- Expandable interface
- Overlay design
- Perfect for immersive experiences

### **3. Inline Mode**

```tsx
<ContextControls
  onContextChange={handleContextChange}
  currentContext={userContext}
  showAdvanced={true}
  className="my-4"
/>
```

**Features:**
- Full interface display
- Advanced options available
- Integrated into page flow
- Customizable styling

## 🔄 **Integration Patterns**

### **1. Basic Smart7 Integration**

```tsx
import { ContextControls } from '../components/ContextControls';
import { useOptimizedSmart7 } from '../hooks/useOptimizedSmart7';

const Smart7WithContext = ({ collectionId }: { collectionId: number }) => {
  const [userContext, setUserContext] = useState<Smart7Context>({
    userTerminal: 'T1',
    pricePreference: 'any',
    timeOfDay: 'auto'
  });

  const {
    selections,
    isLoading,
    refresh,
    updateContext
  } = useOptimizedSmart7({
    collectionId,
    enableOptimizations: true
  });

  const handleContextChange = useCallback((newContext: Smart7Context) => {
    setUserContext(newContext);
    
    // Update Smart7 context
    updateContext(newContext);
    
    // Refresh selections with new context
    refresh();
  }, [updateContext, refresh]);

  return (
    <div>
      {/* Context Controls */}
      <ContextControls
        onContextChange={handleContextChange}
        currentContext={userContext}
        availableTerminals={['T1', 'T2', 'T3', 'T4']}
        showAdvanced={true}
        enableAutoContext={true}
      />

      {/* Smart7 Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <AmenitiesGrid amenities={selections} />
      )}
    </div>
  );
};
```

### **2. Advanced Integration with Tracking**

```tsx
import { sessionTracker } from '../utils/sessionTracking';
import { performanceOptimizer } from '../utils/smart7PerformanceOptimizer';

const AdvancedContextIntegration = () => {
  const [context, setContext] = useState<Smart7Context>({});
  const [contextHistory, setContextHistory] = useState<Smart7Context[]>([]);

  // Load context from session
  useEffect(() => {
    const sessionContext = sessionTracker.getSessionContext();
    if (sessionContext) {
      setContext(sessionContext);
      setContextHistory(prev => [...prev, sessionContext]);
    }
  }, []);

  const handleContextChange = useCallback(async (newContext: Smart7Context) => {
    // Update local state
    setContext(newContext);
    setContextHistory(prev => [...prev, newContext]);

    // Update session
    sessionTracker.updateSessionContext(newContext);

    // Cache context for performance
    performanceOptimizer.cache(
      `user_context_${sessionTracker.getSessionId()}`,
      newContext,
      30 * 60 * 1000 // 30 minutes
    );

    // Track context change
    sessionTracker.trackInteraction(0, 'view', {
      context_data: {
        context_update: 'full_update',
        new_context: newContext,
        timestamp: new Date().toISOString()
      }
    } as any);
  }, []);

  return (
    <ContextControls
      onContextChange={handleContextChange}
      currentContext={context}
      showAdvanced={true}
      enableAutoContext={true}
    />
  );
};
```

### **3. Real-time Context Updates**

```tsx
import { supabaseRealtimeService } from '../services/supabaseRealtimeService';

const RealTimeContextControls = ({ collectionId }: { collectionId: number }) => {
  const [context, setContext] = useState<Smart7Context>({});
  const [isLive, setIsLive] = useState(false);

  // Subscribe to real-time context updates
  useEffect(() => {
    if (!isLive) return;

    const unsubscribe = supabaseRealtimeService.subscribeToCollection(
      collectionId,
      (update) => {
        if (update.update_type === 'context_updated') {
          setContext(update.data);
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
          Enable Live Context Updates
        </label>
      </div>

      <ContextControls
        onContextChange={setContext}
        currentContext={context}
        showAdvanced={true}
      />
    </div>
  );
};
```

## 🎯 **Use Case Examples**

### **1. Mobile-First Experience**

```tsx
const MobileContextControls = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ContextControls
      compact={isMobile}
      floating={isMobile}
      onContextChange={handleContextChange}
      currentContext={userContext}
      enableAutoContext={true}
    />
  );
};
```

### **2. Accessibility-Focused Interface**

```tsx
const AccessibleContextControls = () => {
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  return (
    <div>
      <div className="accessibility-toggle">
        <label>
          <input
            type="checkbox"
            checked={accessibilityMode}
            onChange={(e) => setAccessibilityMode(e.target.checked)}
          />
          Enhanced Accessibility Mode
        </label>
      </div>

      <ContextControls
        onContextChange={handleContextChange}
        currentContext={userContext}
        showAdvanced={accessibilityMode}
        className={accessibilityMode ? 'high-contrast large-text' : ''}
      />
    </div>
  );
};
```

### **3. Performance-Optimized Context**

```tsx
const PerformanceContextControls = () => {
  const [performanceMode, setPerformanceMode] = useState(false);

  const handleContextChange = useCallback((newContext: Smart7Context) => {
    // Use performance optimizer for context changes
    if (performanceMode) {
      performanceOptimizer.cache(
        `context_${JSON.stringify(newContext)}`,
        newContext,
        5 * 60 * 1000 // 5 minutes
      );
    }

    onContextChange(newContext);
  }, [performanceMode, onContextChange]);

  return (
    <div>
      <div className="performance-toggle">
        <label>
          <input
            type="checkbox"
            checked={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.checked)}
          />
          Performance Mode (Aggressive Caching)
        </label>
      </div>

      <ContextControls
        onContextChange={handleContextChange}
        currentContext={userContext}
        enableAutoContext={!performanceMode} // Disable auto-detect in performance mode
      />
    </div>
  );
};
```

## 🚨 **Error Handling & Fallbacks**

### **1. Graceful Degradation**

```tsx
const ResilientContextControls = () => {
  const [hasError, setHasError] = useState(false);
  const [fallbackContext, setFallbackContext] = useState<Smart7Context>({});

  const handleContextChange = useCallback(async (newContext: Smart7Context) => {
    try {
      // Try to update session
      await sessionTracker.updateSessionContext(newContext);
      setHasError(false);
    } catch (error) {
      console.error('Failed to update context:', error);
      setHasError(true);
      
      // Store locally as fallback
      setFallbackContext(newContext);
      localStorage.setItem('fallback_context', JSON.stringify(newContext));
    }
  }, []);

  // Load fallback context on error
  useEffect(() => {
    if (hasError) {
      const stored = localStorage.getItem('fallback_context');
      if (stored) {
        try {
          setFallbackContext(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse fallback context:', e);
        }
      }
    }
  }, [hasError]);

  return (
    <div>
      {hasError && (
        <div className="error-banner">
          ⚠️ Context updates are being stored locally due to connection issues
        </div>
      )}

      <ContextControls
        onContextChange={handleContextChange}
        currentContext={hasError ? fallbackContext : userContext}
        enableAutoContext={!hasError}
      />
    </div>
  );
};
```

### **2. Circuit Breaker Pattern**

```tsx
const CircuitBreakerContextControls = () => {
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const executeWithCircuitBreaker = useCallback(async (operation: () => Promise<any>) => {
    if (isCircuitOpen) {
      throw new Error('Circuit breaker is open - too many failures');
    }

    try {
      const result = await operation();
      setErrorCount(0);
      return result;
    } catch (error) {
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= 4) {
        setIsCircuitOpen(true);
        setTimeout(() => {
          setIsCircuitOpen(false);
          setErrorCount(0);
        }, 60000); // Close after 1 minute
      }
      
      throw error;
    }
  }, [isCircuitOpen, errorCount]);

  const handleContextChange = useCallback((newContext: Smart7Context) => {
    executeWithCircuitBreaker(async () => {
      await sessionTracker.updateSessionContext(newContext);
      onContextChange(newContext);
    }).catch(error => {
      console.error('Context update failed:', error);
    });
  }, [executeWithCircuitBreaker, onContextChange]);

  return (
    <div>
      {isCircuitOpen && (
        <div className="circuit-breaker-alert">
          ⚠️ Context updates temporarily unavailable. Retrying in 1 minute...
        </div>
      )}

      <ContextControls
        onContextChange={handleContextChange}
        currentContext={userContext}
        enableAutoContext={!isCircuitOpen}
      />
    </div>
  );
};
```

## 📊 **Performance Monitoring**

### **1. Context Change Analytics**

```tsx
const AnalyticsContextControls = () => {
  const [analytics, setAnalytics] = useState({
    totalChanges: 0,
    averageChangeTime: 0,
    mostChangedField: '',
    lastChangeTime: null as Date | null
  });

  const handleContextChange = useCallback((newContext: Smart7Context) => {
    const startTime = performance.now();
    
    // Track analytics
    setAnalytics(prev => {
      const changes = Object.keys(newContext).filter(key => 
        newContext[key as keyof Smart7Context] !== prev[key as keyof Smart7Context]
      );
      
      return {
        totalChanges: prev.totalChanges + changes.length,
        averageChangeTime: prev.averageChangeTime,
        mostChangedField: changes[0] || prev.mostChangedField,
        lastChangeTime: new Date()
      };
    });

    // Measure performance
    const changeTime = performance.now() - startTime;
    setAnalytics(prev => ({
      ...prev,
      averageChangeTime: (prev.averageChangeTime + changeTime) / 2
    }));

    onContextChange(newContext);
  }, [onContextChange]);

  return (
    <div>
      <div className="analytics-panel">
        <h4>Context Analytics</h4>
        <div className="analytics-grid">
          <div>Total Changes: {analytics.totalChanges}</div>
          <div>Avg Change Time: {analytics.averageChangeTime.toFixed(2)}ms</div>
          <div>Most Changed: {analytics.mostChangedField}</div>
          <div>Last Change: {analytics.lastChangeTime?.toLocaleTimeString()}</div>
        </div>
      </div>

      <ContextControls
        onContextChange={handleContextChange}
        currentContext={userContext}
        showAdvanced={true}
      />
    </div>
  );
};
```

## 🔮 **Future Enhancements**

### **Planned Features**
- **Machine Learning Context Prediction** - Predict user preferences
- **Voice Control Integration** - Voice-activated context changes
- **Gesture Recognition** - Touch and gesture-based controls
- **Context Templates** - Save and load context presets

### **Integration Opportunities**
- **AI-Powered Suggestions** - Intelligent context recommendations
- **Predictive Context** - Anticipate user needs
- **Context Synchronization** - Multi-device context sync
- **Advanced Analytics** - Deep insights into user behavior

---

The ContextControls component provides a comprehensive and intuitive way to manage user context in the Smart7 system. With multiple display modes, intelligent auto-detection, and seamless integration with the tracking and performance systems, it ensures optimal user experience across all devices and use cases.

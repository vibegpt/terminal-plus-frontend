# Smart7 Tracking System

A comprehensive analytics and user behavior tracking system for the Terminal Plus application, designed to capture user interactions, preferences, and collection performance metrics.

## 🏗️ Architecture Overview

The tracking system consists of four main components:

1. **Types** (`src/types/tracking.ts`) - TypeScript interfaces for all tracking data
2. **Session Tracker** (`src/utils/sessionTracking.ts`) - Core tracking logic and session management
3. **Supabase Service** (`src/services/supabaseTrackingService.ts`) - Backend data persistence
4. **React Hooks** (`src/hooks/useTracking.tsx`) - Easy-to-use tracking hooks for components

## 🚀 Quick Start

### 1. Basic Usage in Components

```tsx
import { useTracking } from '../hooks/useTracking';

const MyComponent = () => {
  const { trackClick, trackBookmark, sessionId } = useTracking({
    amenityId: 123,
    collectionId: 456,
    autoTrackView: true
  });

  return (
    <button onClick={trackClick}>Click me</button>
  );
};
```

### 2. Collection Tracking

```tsx
import { useCollectionTracking } from '../hooks/useTracking';

const CollectionView = ({ collectionId }) => {
  const { getPerformanceStats } = useCollectionTracking(collectionId);
  
  // Automatically tracks collection view on mount
  // Provides access to performance analytics
};
```

## 📊 What Gets Tracked

### User Sessions
- Anonymous session IDs
- Device type detection
- Terminal preferences
- Session duration and activity

### Amenity Interactions
- **Views** - Time spent viewing amenities
- **Clicks** - User engagement with amenities
- **Bookmarks** - Saved/favorited items
- **Shares** - Social sharing actions
- **Navigation** - Directions/maps usage

### Smart7 Selections
- AI-recommended amenity displays
- Position in recommendation lists
- Context data for recommendations

### Collection Performance
- View counts and click-through rates
- User engagement patterns
- Smart7 selection effectiveness

## 🎯 Key Features

### Automatic View Tracking
```tsx
const { trackClick } = useTracking({
  amenityId: 123,
  autoTrackView: true,        // Automatically track views
  viewThresholdMs: 800        // Count as view after 800ms
});
```

### Buffered Interactions
- Interactions are buffered locally and sent in batches
- Automatic flushing every 5 seconds
- Graceful fallback on network issues
- Page unload protection with `sendBeacon`

### Session Persistence
- Sessions persist across page refreshes
- 30-minute timeout for inactive sessions
- Automatic session recovery

### Device Detection
- Automatic mobile/tablet/desktop detection
- User agent parsing for device insights

## 🔧 Configuration

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Tracking Options
```tsx
interface UseTrackingOptions {
  amenityId?: number;           // Amenity being tracked
  collectionId?: number;         // Collection context
  autoTrackView?: boolean;       // Auto-track view events
  viewThresholdMs?: number;      // Minimum view time threshold
}
```

## 📈 Analytics & Insights

### User Preferences
```tsx
const { getUserPreferences } = useTracking();
const preferences = await getUserPreferences();

// Returns:
{
  topVibePreferences: ['cozy', 'luxury', 'family-friendly'],
  preferredPriceLevel: ['$$', '$'],
  frequentlyClickedAmenities: [123, 456, 789],
  engagementPattern: 'explorer' // 'quick' | 'explorer' | 'focused'
}
```

### Collection Performance
```tsx
const { getPerformanceStats } = useCollectionTracking(collectionId);
const stats = await getPerformanceStats({
  start: '2024-01-01',
  end: '2024-01-31'
});
```

## 🛡️ Privacy & Performance

### Privacy Features
- Anonymous session tracking (no PII)
- Local buffering reduces server calls
- Graceful degradation when tracking fails

### Performance Optimizations
- Batch processing of interactions
- Debounced view tracking
- Efficient session storage usage
- Minimal impact on UI performance

## 🗄️ Database Schema

### Required Tables

#### `user_sessions`
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  terminal_code TEXT,
  device_type TEXT,
  user_agent TEXT,
  session_data JSONB
);
```

#### `amenity_interactions`
```sql
CREATE TABLE amenity_interactions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  amenity_id INTEGER NOT NULL,
  collection_id INTEGER,
  interaction_type TEXT NOT NULL,
  interaction_timestamp TIMESTAMP NOT NULL,
  time_spent_seconds INTEGER,
  position_in_list INTEGER,
  is_smart7_selection BOOLEAN DEFAULT FALSE,
  context_data JSONB
);
```

#### `collection_performance`
```sql
CREATE TABLE collection_performance (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  avg_time_spent DECIMAL(8,2) DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  smart7_selections INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  UNIQUE(collection_id, date)
);
```

## 🚨 Error Handling

The system gracefully handles various failure scenarios:

- **Network failures** - Interactions are buffered and retried
- **Missing Supabase** - Falls back to local storage only
- **Invalid data** - Logs errors and continues operation
- **Storage quota** - Gracefully degrades functionality

## 🔄 Integration Examples

### Amenity Cards
```tsx
const AmenityCard = ({ amenity, collectionId }) => {
  const { trackClick, trackBookmark, trackShare } = useTracking({
    amenityId: amenity.id,
    collectionId,
    autoTrackView: true
  });

  return (
    <div onClick={trackClick}>
      <button onClick={trackBookmark}>Save</button>
      <button onClick={trackShare}>Share</button>
    </div>
  );
};
```

### Smart7 Recommendations
```tsx
const Smart7List = ({ recommendations, collectionId }) => {
  const { trackSmart7Display } = useTracking({ collectionId });

  useEffect(() => {
    // Track when Smart7 recommendations are displayed
    trackSmart7Display(
      recommendations.map(r => r.id),
      { reason: 'user_preferences', time_of_day: 'afternoon' }
    );
  }, [recommendations]);

  return <div>{/* render recommendations */}</div>;
};
```

### Terminal Selection
```tsx
const TerminalSelector = () => {
  const { setTerminal } = useTracking();

  const handleTerminalChange = (terminal: string) => {
    setTerminal(terminal);
    // Terminal preference is now tracked in session
  };

  return <select onChange={(e) => handleTerminalChange(e.target.value)}>{/* options */}</select>;
};
```

## 📝 Best Practices

1. **Always provide context** - Include `amenityId` and `collectionId` when possible
2. **Use autoTrackView** - Enable automatic view tracking for better engagement data
3. **Handle errors gracefully** - The system will continue working even if tracking fails
4. **Respect user privacy** - Only track necessary interactions
5. **Test thoroughly** - Verify tracking works in your specific use cases

## 🐛 Troubleshooting

### Common Issues

**Tracking not working:**
- Check browser console for errors
- Verify Supabase environment variables
- Ensure components are wrapped in tracking context

**Sessions not persisting:**
- Check sessionStorage availability
- Verify no privacy blockers are active
- Check for storage quota issues

**Performance issues:**
- Reduce interaction frequency
- Increase flush intervals
- Monitor buffer sizes

### Debug Mode
```tsx
// Enable debug logging
localStorage.setItem('smart7_debug', 'true');
```

## 🔮 Future Enhancements

- Real-time analytics dashboard
- A/B testing framework
- Advanced user segmentation
- Machine learning insights
- Export capabilities for data analysis

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Web Analytics Standards](https://www.w3.org/TR/webanalytics/)

---

**Note:** This tracking system is designed to be privacy-first and performance-conscious. All data is anonymous and stored securely in Supabase. Users can clear their session data at any time using the `clearSession()` method.

# Provider Architecture Documentation

## 🏗️ **Provider Structure Overview**

Terminal Plus now uses a centralized provider architecture that wraps all context providers and React Query configuration in a single, well-organized structure.

## 📁 **File Structure**

```
src/
├── providers/
│   └── AppProviders.tsx          # Centralized provider wrapper
├── context/
│   ├── TerminalContext.tsx       # Terminal selection and data
│   ├── JourneyContext.tsx        # User journey tracking
│   ├── UserPreferencesContext.tsx # User settings and preferences
│   ├── OfflineContext.tsx        # Offline data management
│   ├── BehaviorTrackingContext.tsx # User behavior analytics
│   ├── AnalyticsContext.tsx      # Analytics and tracking
│   ├── FlightContext.tsx         # Flight information
│   └── ThemeProvider.tsx         # Theme management
└── App.tsx                       # Main app with provider integration
```

## 🔧 **AppProviders.tsx**

### **Purpose**
Centralized provider wrapper that manages all context providers and React Query configuration in a single location.

### **Features**
- **React Query Configuration**: Optimized query client with smart retry logic
- **Provider Nesting**: Proper provider hierarchy for dependency management
- **Development Tools**: React Query DevTools in development mode
- **Error Handling**: Centralized error handling for mutations

### **Configuration**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 404s
        if (error?.status === 404) return false;
        // Retry network errors up to 3 times
        if (!error?.status && failureCount < 3) return true;
        return false;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      onError: (error) => {
        console.error('Mutation error:', error);
        // Show toast notification
      },
    },
  },
});
```

### **Provider Hierarchy**
```tsx
<QueryClientProvider client={queryClient}>
  <OfflineProvider>
    <TerminalProvider>
      <JourneyProvider>
        <UserPreferencesProvider>
          <BehaviorTrackingProvider>
            {children}
            {import.meta.env.DEV && <ReactQueryDevtools />}
          </BehaviorTrackingProvider>
        </UserPreferencesProvider>
      </JourneyProvider>
    </TerminalProvider>
  </OfflineProvider>
</QueryClientProvider>
```

## 🎯 **Context Providers**

### **1. TerminalContext.tsx**
**Purpose**: Manages terminal selection and terminal-specific data
**Features**:
- Terminal selection state
- Terminal-specific amenities and collections
- Terminal switching logic
- Terminal data caching

### **2. JourneyContext.tsx**
**Purpose**: Tracks user journey through the airport
**Features**:
- Journey start/end tracking
- Amenities visited during journey
- Journey duration and statistics
- Journey persistence

### **3. UserPreferencesContext.tsx**
**Purpose**: Manages user settings and preferences
**Features**:
- Theme preferences (light/dark/system)
- Language settings
- Notification preferences
- Accessibility options
- Terminal preferences
- Preferred vibes
- Local storage persistence

### **4. OfflineContext.tsx**
**Purpose**: Handles offline data management and sync
**Features**:
- Online/offline status monitoring
- Offline data storage
- Data synchronization when online
- Offline-ready state management
- Local storage for offline data

### **5. BehaviorTrackingContext.tsx**
**Purpose**: Tracks user behavior for analytics
**Features**:
- Event tracking (page views, clicks, searches)
- Session management
- Amenity and collection view tracking
- Journey analytics
- Data export functionality
- Google Analytics integration

### **6. AnalyticsContext.tsx**
**Purpose**: Analytics and tracking integration
**Features**:
- Google Analytics integration
- Sentry error tracking
- PostHog analytics
- Custom event tracking
- Performance monitoring

### **7. FlightContext.tsx**
**Purpose**: Flight information management
**Features**:
- Flight details
- Flight status
- Gate information
- Flight updates
- Flight-related amenities

### **8. ThemeProvider.tsx**
**Purpose**: Theme management and styling
**Features**:
- Theme switching
- Dark/light mode
- Custom theme support
- CSS variable management

## 🚀 **Usage Examples**

### **Using Context Hooks**
```tsx
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { useOffline } from '@/context/OfflineContext';
import { useBehaviorTracking } from '@/context/BehaviorTrackingContext';

function MyComponent() {
  const { preferences, updatePreferences } = useUserPreferences();
  const { isOnline, addOfflineData } = useOffline();
  const { trackEvent, trackPageView } = useBehaviorTracking();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updatePreferences({ theme });
    trackEvent('click', { action: 'theme_change', theme });
  };

  return (
    <div>
      <button onClick={() => handleThemeChange('dark')}>
        Dark Mode
      </button>
    </div>
  );
}
```

### **Using React Query**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

function AmenityList() {
  const { data: amenities, isLoading } = useQuery({
    queryKey: ['amenities'],
    queryFn: fetchAmenities,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: updateAmenity,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {amenities?.map(amenity => (
        <div key={amenity.id}>{amenity.name}</div>
      ))}
    </div>
  );
}
```

## 🔄 **Data Flow**

### **Provider Data Flow**
```
App.tsx
└── AppProviders
    ├── QueryClientProvider (React Query)
    ├── OfflineProvider (Offline state)
    ├── TerminalProvider (Terminal data)
    ├── JourneyProvider (Journey tracking)
    ├── UserPreferencesProvider (User settings)
    └── BehaviorTrackingProvider (Analytics)
```

### **Context Usage Flow**
```
Component
├── useUserPreferences() → UserPreferencesContext
├── useOffline() → OfflineContext
├── useBehaviorTracking() → BehaviorTrackingContext
├── useQuery() → React Query
└── useMutation() → React Query
```

## 📊 **Performance Benefits**

### **Optimized React Query Configuration**
- **Stale Time**: 2 minutes (reduces unnecessary refetches)
- **GC Time**: 10 minutes (keeps data in cache longer)
- **Smart Retry**: Only retries network errors, not 404s
- **Window Focus**: Refetches when user returns to tab
- **Reconnect**: Always refetches when connection restored

### **Context Optimization**
- **Provider Nesting**: Minimal re-renders through proper hierarchy
- **Local Storage**: Persistent state across sessions
- **Lazy Loading**: Contexts only load when needed
- **Error Boundaries**: Graceful error handling

### **Bundle Size Impact**
- **Centralized**: Single provider file reduces duplication
- **Tree Shaking**: Unused contexts can be eliminated
- **Code Splitting**: Providers can be lazy loaded
- **Minification**: Better compression with centralized structure

## 🛠️ **Development Tools**

### **React Query DevTools**
- **Development Only**: Only shows in development mode
- **Query Inspector**: View all active queries
- **Mutation Inspector**: Monitor mutations
- **Cache Inspector**: Examine cached data
- **Performance**: Monitor query performance

### **Context Debugging**
- **React DevTools**: Inspect context values
- **Console Logging**: Debug context updates
- **Local Storage**: Inspect persisted data
- **Network Tab**: Monitor API calls

## 🔧 **Configuration Options**

### **React Query Settings**
```typescript
// Customize per query
const { data } = useQuery({
  queryKey: ['amenities'],
  queryFn: fetchAmenities,
  staleTime: 5 * 60 * 1000,     // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes
  retry: 3,                      // Custom retry count
  refetchOnWindowFocus: false,   // Disable window focus refetch
});
```

### **Context Settings**
```typescript
// UserPreferencesContext
const { updatePreferences } = useUserPreferences();
updatePreferences({
  theme: 'dark',
  notifications: true,
  accessibility: {
    highContrast: true,
    largeText: false,
    reducedMotion: false,
  },
});
```

## 🚨 **Error Handling**

### **Query Error Handling**
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['amenities'],
  queryFn: fetchAmenities,
  retry: (failureCount, error) => {
    if (error?.status === 404) return false;
    return failureCount < 3;
  },
});

if (isError) {
  return <div>Error: {error.message}</div>;
}
```

### **Mutation Error Handling**
```typescript
const mutation = useMutation({
  mutationFn: updateAmenity,
  onError: (error) => {
    console.error('Mutation failed:', error);
    // Show toast notification
  },
  onSuccess: () => {
    // Show success message
  },
});
```

### **Context Error Handling**
```typescript
// Each context has error boundaries
try {
  const { preferences } = useUserPreferences();
} catch (error) {
  console.error('Context error:', error);
  // Fallback to default values
}
```

## 📈 **Monitoring and Analytics**

### **Behavior Tracking**
```typescript
const { trackEvent, trackPageView } = useBehaviorTracking();

// Track page views
useEffect(() => {
  trackPageView('amenity-detail', { amenityId: '123' });
}, []);

// Track user actions
const handleClick = () => {
  trackEvent('click', { action: 'amenity_bookmark', amenityId: '123' });
};
```

### **Performance Monitoring**
```typescript
// React Query provides built-in performance metrics
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['amenities'],
  queryFn: fetchAmenities,
  // Query performance is automatically tracked
});
```

## 🎯 **Best Practices**

### **Provider Usage**
1. **Single Source**: Use one provider per context type
2. **Proper Nesting**: Order providers by dependency
3. **Error Boundaries**: Wrap providers in error boundaries
4. **Performance**: Avoid unnecessary re-renders

### **Context Usage**
1. **Custom Hooks**: Always use custom hooks for contexts
2. **Error Handling**: Handle context errors gracefully
3. **Default Values**: Provide sensible defaults
4. **Persistence**: Use localStorage for important state

### **React Query Usage**
1. **Query Keys**: Use consistent, hierarchical query keys
2. **Stale Time**: Set appropriate stale times
3. **Error Handling**: Handle query errors properly
4. **Mutations**: Use mutations for data updates

This provider architecture provides a solid foundation for managing state, data fetching, and user preferences in Terminal Plus! 🚀

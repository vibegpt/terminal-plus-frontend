# Zustand Stores Documentation

## 🏪 **Store Architecture Overview**

Terminal Plus now includes powerful Zustand stores with Immer integration for immutable state updates. These stores provide a lightweight, performant alternative to Context API for complex state management.

## 📁 **Store Structure**

```
src/stores/
├── index.ts                    # Store exports
├── useAppStore.ts             # Main application store
├── useAmenitiesStore.ts       # Amenities data store
└── useCollectionsStore.ts     # Collections data store
```

## 🚀 **Key Features**

### **Zustand Benefits**
- **Lightweight**: Only 2.9KB gzipped
- **No Boilerplate**: Minimal setup required
- **TypeScript**: Full type safety
- **DevTools**: Redux DevTools integration
- **Performance**: Optimized re-renders
- **Persistence**: Built-in persistence support

### **Immer Integration**
- **Immutable Updates**: Write mutable-like code
- **Performance**: Efficient immutable updates
- **Readability**: Clean, intuitive syntax
- **Type Safety**: Full TypeScript support

### **Middleware Stack**
- **Immer**: Immutable state updates
- **DevTools**: Redux DevTools integration
- **SubscribeWithSelector**: Fine-grained subscriptions
- **Persistence**: Selective state persistence

## 🏗️ **Store Implementations**

### **1. useAppStore.ts - Main Application Store**

#### **Purpose**
Central store for application-wide state including UI state, user data, terminal selection, journey tracking, and search functionality.

#### **State Structure**
```typescript
interface AppState {
  // UI State
  isLoading: boolean;
  isOffline: boolean;
  currentPage: string;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // User State
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    preferences: {
      notifications: boolean;
      locationSharing: boolean;
      analytics: boolean;
    };
  } | null;
  
  // Terminal State
  selectedTerminal: string | null;
  terminalData: {
    amenities: any[];
    collections: any[];
    vibes: any[];
  };
  
  // Journey State
  currentJourney: {
    id: string | null;
    startTime: Date | null;
    amenitiesVisited: string[];
    terminal: string | null;
    vibe: string | null;
  } | null;
  
  // Search State
  searchQuery: string;
  searchFilters: {
    vibe: string | null;
    terminal: string | null;
    priceRange: [number, number] | null;
    distance: number | null;
  };
}
```

#### **Usage Examples**
```typescript
import { useUI, useUser, useAppActions } from '@/stores';

function MyComponent() {
  const { isLoading, theme } = useUI();
  const user = useUser();
  const { setTheme, setLoading } = useAppActions();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <div>
      <button onClick={() => setLoading(!isLoading)}>
        {isLoading ? 'Loading...' : 'Load'}
      </button>
    </div>
  );
}
```

### **2. useAmenitiesStore.ts - Amenities Data Store**

#### **Purpose**
Specialized store for managing amenities data, filtering, search, pagination, and user interactions like bookmarks and recently viewed.

#### **State Structure**
```typescript
interface AmenitiesState {
  // Data
  amenities: Amenity[];
  filteredAmenities: Amenity[];
  selectedAmenity: Amenity | null;
  bookmarkedAmenities: string[];
  recentlyViewed: string[];
  
  // Filters
  filters: {
    vibe: string | null;
    terminal: string | null;
    priceRange: [number, number] | null;
    distance: number | null;
    searchQuery: string;
    features: string[];
    rating: number | null;
  };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
```

#### **Usage Examples**
```typescript
import { 
  useAmenities, 
  useFilteredAmenities, 
  useAmenitiesActions,
  useBookmarkedAmenities 
} from '@/stores';

function AmenitiesList() {
  const amenities = useFilteredAmenities();
  const bookmarked = useBookmarkedAmenities();
  const { 
    setSelectedAmenity, 
    toggleBookmark, 
    searchAmenities,
    setFilters 
  } = useAmenitiesActions();

  const handleSearch = (query: string) => {
    searchAmenities(query);
  };

  const handleFilter = (vibe: string) => {
    setFilters({ vibe });
  };

  return (
    <div>
      {amenities.map(amenity => (
        <div key={amenity.id}>
          <h3>{amenity.name}</h3>
          <button onClick={() => toggleBookmark(amenity.id)}>
            {bookmarked.includes(amenity.id) ? '❤️' : '🤍'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### **3. useCollectionsStore.ts - Collections Data Store**

#### **Purpose**
Specialized store for managing collections data, filtering, search, and special collection types like featured and Smart7 collections.

#### **State Structure**
```typescript
interface CollectionsState {
  // Data
  collections: Collection[];
  filteredCollections: Collection[];
  selectedCollection: Collection | null;
  featuredCollections: Collection[];
  smart7Collections: Collection[];
  
  // Filters
  filters: {
    vibe: string | null;
    terminal: string | null;
    difficulty: string | null;
    duration: [number, number] | null;
    distance: number | null;
    searchQuery: string;
    tags: string[];
    isFeatured: boolean | null;
    isSmart7: boolean | null;
  };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
```

#### **Usage Examples**
```typescript
import { 
  useCollections, 
  useFeaturedCollections,
  useSmart7Collections,
  useCollectionsActions 
} from '@/stores';

function CollectionsPage() {
  const collections = useCollections();
  const featured = useFeaturedCollections();
  const smart7 = useSmart7Collections();
  const { setSelectedCollection, searchCollections } = useCollectionsActions();

  return (
    <div>
      <h2>Featured Collections</h2>
      {featured.map(collection => (
        <div key={collection.id} onClick={() => setSelectedCollection(collection)}>
          <h3>{collection.name}</h3>
          <p>{collection.description}</p>
        </div>
      ))}
      
      <h2>Smart7 Collections</h2>
      {smart7.map(collection => (
        <div key={collection.id} onClick={() => setSelectedCollection(collection)}>
          <h3>{collection.name}</h3>
          <p>{collection.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 **Advanced Features**

### **1. Immer Integration**
```typescript
// Without Immer (verbose)
setState((state) => ({
  ...state,
  user: {
    ...state.user,
    preferences: {
      ...state.user.preferences,
      notifications: true
    }
  }
}));

// With Immer (clean)
setState((state) => {
  state.user.preferences.notifications = true;
});
```

### **2. Selective Subscriptions**
```typescript
// Only re-render when specific state changes
const theme = useAppStore((state) => state.theme);
const isLoading = useAppStore((state) => state.isLoading);

// Custom selector for derived state
const userDisplayName = useAppStore((state) => 
  state.user ? `${state.user.name} (${state.user.email})` : 'Guest'
);
```

### **3. Persistence**
```typescript
// Selective persistence - only save important state
{
  name: 'terminal-plus-store',
  partialize: (state) => ({
    theme: state.theme,
    user: state.user,
    selectedTerminal: state.selectedTerminal,
    searchFilters: state.searchFilters,
  }),
}
```

### **4. DevTools Integration**
```typescript
// Redux DevTools integration
devtools(
  subscribeWithSelector(
    immer((set, get) => ({
      // store implementation
    }))
  ),
  {
    name: 'terminal-plus-store',
    partialize: (state) => ({ /* selective persistence */ }),
  }
)
```

## 🔧 **Store Integration with React Query**

### **Combining Zustand with React Query**
```typescript
import { useQuery } from '@tanstack/react-query';
import { useAmenities, useAmenitiesActions } from '@/stores';

function AmenitiesPage() {
  const amenities = useAmenities();
  const { setAmenities, setLoading, setError } = useAmenitiesActions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/amenities');
        const data = await response.json();
        setAmenities(data);
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {amenities.map(amenity => (
        <div key={amenity.id}>{amenity.name}</div>
      ))}
    </div>
  );
}
```

## 📊 **Performance Optimizations**

### **1. Selective Subscriptions**
```typescript
// ✅ Good - only subscribes to specific state
const theme = useAppStore((state) => state.theme);

// ❌ Bad - subscribes to entire state
const { theme } = useAppStore();
```

### **2. Memoized Selectors**
```typescript
// Custom selector for derived state
const expensiveComputation = useMemo(() => {
  return useAppStore((state) => {
    // Expensive computation here
    return state.amenities.filter(/* complex logic */);
  });
}, []);
```

### **3. Store Splitting**
```typescript
// Split large stores into smaller, focused stores
const useUIStore = create(/* UI state only */);
const useDataStore = create(/* Data state only */);
const useUserStore = create(/* User state only */);
```

## 🚨 **Error Handling**

### **Store Error Handling**
```typescript
const { error, setError } = useAmenitiesActions();

const fetchAmenities = async () => {
  try {
    const data = await api.getAmenities();
    setAmenities(data);
  } catch (err) {
    setError(err.message);
  }
};
```

### **Component Error Handling**
```typescript
function AmenitiesList() {
  const { error } = useAmenitiesError();
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return <div>{/* amenities list */}</div>;
}
```

## 🧪 **Testing Stores**

### **Store Testing**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/stores/useAppStore';

test('should update theme', () => {
  const { result } = renderHook(() => useAppStore());
  
  act(() => {
    result.current.setTheme('dark');
  });
  
  expect(result.current.theme).toBe('dark');
});
```

### **Component Testing**
```typescript
import { render, screen } from '@testing-library/react';
import { useAppStore } from '@/stores/useAppStore';

test('should display theme', () => {
  // Set initial state
  useAppStore.setState({ theme: 'dark' });
  
  render(<MyComponent />);
  
  expect(screen.getByText('Dark Mode')).toBeInTheDocument();
});
```

## 📈 **Migration from Context API**

### **Before (Context API)**
```typescript
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### **After (Zustand)**
```typescript
const useThemeStore = create((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));

function useTheme() {
  return useThemeStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }));
}
```

## 🎯 **Best Practices**

### **1. Store Design**
- **Single Responsibility**: Each store should have a clear purpose
- **Minimal State**: Only store what you need
- **Derived State**: Compute derived state in selectors
- **Normalization**: Normalize complex data structures

### **2. Performance**
- **Selective Subscriptions**: Only subscribe to needed state
- **Memoization**: Use useMemo for expensive computations
- **Store Splitting**: Split large stores into smaller ones
- **Persistence**: Only persist necessary state

### **3. TypeScript**
- **Full Typing**: Type all state and actions
- **Generic Types**: Use generics for reusable patterns
- **Type Guards**: Use type guards for runtime safety
- **Interface Segregation**: Split large interfaces

### **4. Testing**
- **Unit Tests**: Test individual store functions
- **Integration Tests**: Test store interactions
- **Component Tests**: Test component-store integration
- **E2E Tests**: Test complete user flows

## 🔮 **Future Enhancements**

### **Planned Features**
- [ ] **Store Middleware**: Custom middleware for logging, analytics
- [ ] **Store Persistence**: Enhanced persistence strategies
- [ ] **Store Validation**: Runtime validation for store state
- [ ] **Store Analytics**: Store usage analytics and monitoring
- [ ] **Store Testing**: Enhanced testing utilities

### **Performance Optimizations**
- [ ] **Store Memoization**: Automatic memoization of selectors
- [ ] **Store Splitting**: Automatic store splitting for large states
- [ ] **Store Preloading**: Preload store data
- [ ] **Store Caching**: Advanced caching strategies

## 📚 **Resources**

### **Documentation**
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Immer Documentation](https://immerjs.github.io/immer/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

### **Examples**
- **Basic Usage**: See `useAppStore.ts`
- **Advanced Features**: See `useAmenitiesStore.ts`
- **Complex State**: See `useCollectionsStore.ts`
- **Integration**: See component examples above

This Zustand store architecture provides a powerful, performant foundation for state management in Terminal Plus! 🚀

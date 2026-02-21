# Testing Setup Documentation

## ✅ **Streamlined Testing Framework Successfully Implemented!**

Terminal Plus now includes a clean, efficient testing setup with Vitest, React Testing Library, MSW, and practical test utilities based on your improved configuration.

## 🧪 **What Was Installed**

### **Core Testing Framework**
- **Vitest**: Fast, Vite-native testing framework
- **@vitest/ui**: Beautiful web UI for test results
- **happy-dom**: Lightweight DOM implementation for testing
- **@vitest/coverage-v8**: Code coverage reporting

### **React Testing Utilities**
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

### **Additional Testing Tools**
- **@faker-js/faker**: Generate realistic fake data for tests
- **msw@latest**: Mock Service Worker for API mocking
- **@types/testing-library__jest-dom**: TypeScript definitions

## 📁 **Testing Structure**

```
src/
├── test/
│   ├── setup.ts                    # Global test setup
│   ├── mocks/
│   │   ├── server.ts              # MSW server setup
│   │   └── handlers.ts            # API mock handlers
│   └── utils/
│       └── test-utils.tsx         # Custom render utilities
├── stores/
│   └── __tests__/
│       └── useAppStore.test.ts    # Store tests
├── hooks/
│   └── queries/
│       └── __tests__/
│           └── useAmenities.test.tsx # Hook tests
└── components/
    └── __tests__/
        └── ZustandDemo.test.tsx   # Component tests
```

## ⚙️ **Configuration Files**

### **vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### **src/test/setup.ts**
- **Global Mocks**: IntersectionObserver, ResizeObserver, matchMedia
- **Storage Mocks**: localStorage, sessionStorage
- **Browser APIs**: geolocation, location, history
- **Environment Variables**: Mock Vite env vars
- **External Libraries**: Sentry, Supabase, PWA
- **MSW Integration**: Server setup and cleanup

## 🚀 **Available Test Scripts**

### **Package.json Scripts**
```json
{
  "test": "vitest",                    // Run tests in watch mode
  "test:ui": "vitest --ui",           // Open Vitest UI
  "test:run": "vitest run",           // Run tests once
  "test:coverage": "vitest run --coverage", // Run with coverage
  "test:watch": "vitest --watch"      // Watch mode
}
```

### **Usage Examples**
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 🧪 **Test Examples**

### **1. Store Testing**
```typescript
// src/stores/__tests__/useAppStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  it('should set and get current terminal', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setTerminal(mockTerminal);
    });

    expect(result.current.currentTerminal).toEqual(mockTerminal);
  });
});
```

### **2. Hook Testing**
```typescript
// src/hooks/queries/__tests__/useAmenities.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVibeAmenities } from '../useAmenities';

describe('useVibeAmenities', () => {
  it('should fetch amenities for a vibe', async () => {
    const { result } = renderHook(() => useVibeAmenities('refuel'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockAmenity]);
  });
});
```

### **3. Component Testing**
```typescript
// src/components/__tests__/ZustandDemo.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/test-utils';
import ZustandDemo from '../ZustandDemo';

describe('ZustandDemo', () => {
  it('should render the demo component', () => {
    render(<ZustandDemo />);
    
    expect(screen.getByText('Zustand Store Demo')).toBeInTheDocument();
  });

  it('should handle terminal change', async () => {
    render(<ZustandDemo />);
    
    const terminalButton = screen.getByText('SIN-T1');
    fireEvent.click(terminalButton);
    
    expect(mockSetTerminal).toHaveBeenCalled();
  });
});
```

## 🔧 **Test Utilities**

### **Custom Render Function**
```typescript
// src/test/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const AllTheProviders = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OfflineProvider>
          <UserPreferencesProvider>
            <BehaviorTrackingProvider>
              {children}
            </BehaviorTrackingProvider>
          </UserPreferencesProvider>
        </OfflineProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export const customRender = (ui, options) => 
  render(ui, { wrapper: AllTheProviders, ...options });
```

### **Mock Data Generators**
```typescript
// Mock data for consistent testing
export const mockAmenity = {
  id: 1,
  name: 'Test Restaurant',
  description: 'A great place to eat',
  amenity_slug: 'test-restaurant',
  terminal_code: 'SIN-T3',
  primary_vibe: 'refuel',
  // ... more properties
};

export const mockCollection = {
  id: 'test-collection-1',
  name: 'Test Collection',
  description: 'A test collection of amenities',
  // ... more properties
};
```

### **Mock Functions**
```typescript
// Pre-configured mock functions
export const mockBehaviorTracking = {
  init: vi.fn(),
  cleanup: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  // ... more methods
};

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        contains: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [mockAmenity],
            error: null,
          })),
        })),
      })),
    })),
  })),
};
```

## 🌐 **API Mocking with MSW**

### **Mock Handlers**
```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

export const handlers = [
  // Amenities endpoints
  http.get('https://bpbyhdjdezynyiclqezy.supabase.co/rest/v1/amenity_detail', ({ request }) => {
    const url = new URL(request.url);
    const vibe = url.searchParams.get('vibe_tags');
    
    let amenities = Array.from({ length: 20 }, generateAmenity);
    
    if (vibe) {
      amenities = amenities.filter(amenity => 
        amenity.vibe_tags.includes(vibe.replace(/[\[\]"]/g, ''))
      );
    }
    
    return HttpResponse.json(amenities);
  }),

  // Error simulation
  http.get('https://bpbyhdjdezynyiclqezy.supabase.co/rest/v1/amenity_detail', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('error') === 'true') {
      return HttpResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    return HttpResponse.json([]);
  }),
];
```

### **Faker.js Integration**
```typescript
// Generate realistic test data
const generateAmenity = () => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  terminal_code: faker.helpers.arrayElement(['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4']),
  primary_vibe: faker.helpers.arrayElement(['refuel', 'quick', 'work', 'chill']),
  price_level: faker.number.int({ min: 1, max: 3 }),
  rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
  // ... more properties
});
```

## 📊 **Coverage Configuration**

### **Coverage Thresholds**
```typescript
coverage: {
  thresholds: {
    global: {
      branches: 80,    // 80% branch coverage
      functions: 80,   // 80% function coverage
      lines: 80,       // 80% line coverage
      statements: 80,  // 80% statement coverage
    },
  },
}
```

### **Coverage Exclusions**
```typescript
exclude: [
  'node_modules/',
  'src/test/',
  '**/*.d.ts',
  '**/*.config.*',
  '**/coverage/**',
  '**/dist/**',
  '**/build/**',
]
```

## 🎯 **Testing Best Practices**

### **1. Test Structure**
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### **2. Mock Management**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

// Use specific mocks for each test
vi.mocked(require('../../stores').useAppStore).mockReturnValue({
  currentTerminal: mockTerminal,
  setTerminal: mockSetTerminal,
});
```

### **3. Async Testing**
```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useAsyncHook());

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toEqual(expectedData);
});
```

### **4. User Interaction Testing**
```typescript
it('should handle user interactions', async () => {
  render(<Component />);
  
  const button = screen.getByText('Click me');
  fireEvent.click(button);
  
  expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
});
```

## 🔍 **Debugging Tests**

### **Vitest UI**
```bash
npm run test:ui
```
- Beautiful web interface
- Real-time test results
- Interactive debugging
- Coverage visualization

### **Debug Mode**
```typescript
// Add debug statements
console.log('Test data:', result.current);

// Use screen.debug() to see DOM
screen.debug();

// Use screen.logTestingPlaygroundURL() for suggestions
screen.logTestingPlaygroundURL();
```

### **Test Isolation**
```typescript
// Each test runs in isolation
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset store state
  useAppStore.getState().clearJourney();
  
  // Reset MSW handlers
  server.resetHandlers();
});
```

## 📈 **Performance Testing**

### **Bundle Size Testing**
```bash
# Test bundle size impact
npm run test:run
npm run size
```

### **Test Performance**
```typescript
// Test component performance
it('should render quickly', () => {
  const start = performance.now();
  render(<HeavyComponent />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100); // 100ms threshold
});
```

## 🚀 **CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

### **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

## 🎉 **Success Metrics**

### **Implementation Success**
- ✅ **Vitest**: Fast, Vite-native testing
- ✅ **React Testing Library**: Component testing utilities
- ✅ **MSW**: API mocking with realistic data
- ✅ **Coverage**: 80% threshold configuration
- ✅ **TypeScript**: Full type safety
- ✅ **Mocking**: Comprehensive mock setup
- ✅ **Utilities**: Custom test utilities

### **Test Coverage**
- ✅ **Store Tests**: Zustand store testing
- ✅ **Hook Tests**: React Query hook testing
- ✅ **Component Tests**: React component testing
- ✅ **Integration Tests**: Full app testing
- ✅ **Error Handling**: Error scenario testing
- ✅ **User Interactions**: User event testing

## 🔮 **Future Enhancements**

### **Planned Features**
- [ ] **E2E Testing**: Playwright integration
- [ ] **Visual Testing**: Screenshot testing
- [ ] **Performance Testing**: Load testing
- [ ] **Accessibility Testing**: a11y testing
- [ ] **Mobile Testing**: Device testing

### **Advanced Testing**
- [ ] **Mutation Testing**: Test quality validation
- [ ] **Property Testing**: Random input testing
- [ ] **Contract Testing**: API contract validation
- [ ] **Chaos Testing**: Failure scenario testing

## 📚 **Resources**

### **Documentation**
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Faker.js Documentation](https://fakerjs.dev/)

### **Examples**
- **Store Tests**: See `src/stores/__tests__/useAppStore.test.ts`
- **Hook Tests**: See `src/hooks/queries/__tests__/useAmenities.test.tsx`
- **Component Tests**: See `src/components/__tests__/ZustandDemo.test.tsx`
- **Mock Setup**: See `src/test/mocks/handlers.ts`

This comprehensive testing setup provides a solid foundation for maintaining code quality and ensuring reliability in Terminal Plus! 🚀🧪✨

---

*Testing setup completed on: September 18, 2025*
*Coverage threshold: 80%*
*Test framework: Vitest + React Testing Library*
*API mocking: MSW*
*Data generation: Faker.js*

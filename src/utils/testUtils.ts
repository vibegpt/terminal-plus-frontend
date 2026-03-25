/**
 * Test utilities for consistent test ID management
 * Generate consistent test IDs for components
 */

export const testIds = {
  // Page elements
  terminalSelect: 'terminal-select',
  boardingTime: 'boarding-time',
  offlineBanner: 'offline-banner',
  loadingSpinner: 'loading-spinner',
  
  // Vibes
  vibe: (name: string) => `vibe-${name}`,
  vibeCollection: 'vibe-collection',
  
  // Amenities
  amenityCard: (id: number) => `amenity-card-${id}`,
  bookmarkButton: 'bookmark-button',
  navigateButton: 'navigate-button',
  shareButton: 'share-button',
  
  // Virtual Scrolling
  virtualAmenityList: 'virtual-amenity-list',
  dynamicVirtualAmenityList: 'dynamic-virtual-amenity-list',
  virtualCollectionList: 'virtual-collection-list',
  virtualScrollContainer: 'virtual-scroll-container',
  
  // Forms
  searchInput: 'search-input',
  filterButton: 'filter-button',
  submitButton: 'submit-button',
};

// Helper for adding test IDs only in non-production
export function getTestId(id: string): { 'data-testid'?: string } {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }
  return { 'data-testid': id };
}

// Test data generators
export const testData = {
  terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'],
  vibes: ['comfort', 'refuel', 'quick', 'chill', 'work', 'discover', 'shop'],
  boardingTimes: ['14:30', '16:45', '08:15', '22:00'],
};

// Wait utilities for tests
export const waitFor = {
  element: (selector: string, timeout = 10000) => ({
    selector,
    timeout,
  }),
  
  navigation: (urlPattern: string | RegExp) => ({
    urlPattern,
  }),
};

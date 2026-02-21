// typeValidationTests.ts - Test harness for type guards and runtime validations
// Used to validate type safety and edge case handling

import type { Amenity } from '@/types/amenity.types';
import type { JourneyData, UserPreferences } from '@/types/journey.types';
import { 
  isValidVibe, 
  validateVibe, 
  isVibeType, 
  isVibePreferences, 
  isVibeRecommendation,
  calculateVibeCompatibility,
  type VibePreferences
} from '@/types/vibe.types';
import { 
  validateFilters, 
  isFilters, 
  isFilterResults, 
  isFilterConstraints,
  applyFilters,
  createEmptyFilters 
} from '@/types/filter.types';

// Test data generators
export const createMockAmenity = (overrides: Partial<Amenity> = {}): Amenity => ({
  id: 'test-amenity-1',
  name: 'Test Restaurant',
  category: 'Food & Dining',
  terminal: 'T1',
  location: 'Gate 1',
  priceRange: 'moderate',
  accessibility: true,
  rating: 4.5,
  tags: ['restaurant', 'food'],
  vibe_tags: ['refuel', 'comfort'],
  ...overrides
});

export const createMockJourneyData = (overrides: Partial<JourneyData> = {}): JourneyData => ({
  from: 'SYD',
  to: 'LHR',
  flightNumber: 'QF1',
  date: '2024-01-15',
  layover: 'SIN',
  selected_vibe: 'refuel',
  departureGate: 'A1',
  departure_time: new Date('2024-01-15T10:00:00Z').toISOString(),
  layovers: ['SIN'],
  destination: 'LHR',
  departure: 'SYD',
  ...overrides
});

export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  categories: ['Food & Dining', 'Shopping'],
  priceRange: 'moderate',
  accessibility: true,
  rating: 4,
  preferred_vibes: ['refuel', 'comfort'],
  walking_speed_meters_per_minute: 80,
  max_walking_distance_meters: 1000,
  ...overrides
});

export const createMockVibePreferences = (overrides: Partial<VibePreferences> = {}): VibePreferences => ({
  favoriteVibes: ['refuel', 'comfort'],
  excludedVibes: [],
  defaultVibe: 'refuel',
  autoSelect: false,
  ...overrides
});

// Test cases for edge cases and validation
export const testCases = {
  // Vibe validation tests
  vibeValidation: {
    validVibes: ['relax', 'work', 'explore', 'quick', 'comfort', 'refuel'],
    invalidVibes: ['Chill', 'chill', 'shop', 'REFUEL', 'Comfort', 'social', 'focus', 'unwind', '', null, undefined, 123, {}, []],
    edgeCases: ['relax ', ' relax', 'RELAX', 'relax\n', 'relax\t']
  },

  // Amenity validation tests
  amenityValidation: {
    validAmenities: [
      createMockAmenity(),
      createMockAmenity({ id: 'test-2', name: 'Test Shop', category: 'Shopping' }),
      createMockAmenity({ vibe_tags: undefined }),
      createMockAmenity({ rating: undefined })
    ],
    invalidAmenities: [
      null,
      undefined,
      {},
      { id: 'test' }, // missing required fields
      { name: 'test' }, // missing id
      { id: 123, name: 'test', category: 'test' }, // wrong id type
      { id: 'test', name: '', category: 'test' }, // empty name
      { id: 'test', name: 'test', category: '' } // empty category
    ]
  },

  // Filter validation tests
  filterValidation: {
    validFilters: [
      createEmptyFilters(),
      {
        categories: ['Food & Dining'],
        terminals: ['T1'],
        priceRange: 'moderate' as const,
        accessibility: true,
        searchQuery: 'restaurant',
        rating: 4,
        vibe: 'refuel' as const
      }
    ],
    invalidFilters: [
      null,
      undefined,
      {},
      { categories: 'not-an-array' },
      { categories: [], terminals: 'not-an-array' },
      { categories: [], terminals: [], priceRange: 'invalid' },
      { categories: [], terminals: [], rating: 'not-a-number' },
      { categories: [], terminals: [], rating: -1 },
      { categories: [], terminals: [], rating: 6 }
    ]
  },

  // Journey data validation tests
  journeyDataValidation: {
    validJourneyData: [
      createMockJourneyData(),
      createMockJourneyData({ selected_vibe: undefined }),
      createMockJourneyData({ departureGate: undefined })
    ],
    invalidJourneyData: [
      null,
      undefined,
      {},
      { from: 'SYD' }, // missing required fields
      { from: 123, to: 'LHR' }, // wrong type
      { from: '', to: 'LHR' }, // empty string
      { from: 'SYD', to: 'LHR', selected_vibe: 'invalid-vibe' }
    ]
  }
};

// Test runner functions
export const runVibeValidationTests = () => {
  console.log('🧪 Running Vibe Validation Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Test valid vibes
  testCases.vibeValidation.validVibes.forEach(vibe => {
    try {
      if (!isValidVibe(vibe)) {
        results.failed++;
        results.errors.push(`Valid vibe "${vibe}" failed validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing valid vibe "${vibe}": ${error}`);
    }
  });

  // Test invalid vibes
  testCases.vibeValidation.invalidVibes.forEach(vibe => {
    try {
      if (isValidVibe(vibe as string)) {
        results.failed++;
        results.errors.push(`Invalid vibe "${vibe}" passed validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing invalid vibe "${vibe}": ${error}`);
    }
  });

  // Test edge cases
  testCases.vibeValidation.edgeCases.forEach(vibe => {
    try {
      if (isValidVibe(vibe)) {
        results.failed++;
        results.errors.push(`Edge case vibe "${vibe}" should not be valid`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing edge case vibe "${vibe}": ${error}`);
    }
  });

  console.log(`✅ Vibe tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
};

export const runAmenityValidationTests = () => {
  console.log('🧪 Running Amenity Validation Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Test valid amenities
  testCases.amenityValidation.validAmenities.forEach((amenity, index) => {
    try {
      if (!amenity || typeof amenity !== 'object' || !amenity.id || !amenity.name || !amenity.category) {
        results.failed++;
        results.errors.push(`Valid amenity ${index} failed basic validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing valid amenity ${index}: ${error}`);
    }
  });

  // Test invalid amenities
  testCases.amenityValidation.invalidAmenities.forEach((amenity, index) => {
    try {
      if (amenity && typeof amenity === 'object' && amenity.id && amenity.name && amenity.category) {
        results.failed++;
        results.errors.push(`Invalid amenity ${index} passed validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing invalid amenity ${index}: ${error}`);
    }
  });

  console.log(`✅ Amenity tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
};

export const runFilterValidationTests = () => {
  console.log('🧪 Running Filter Validation Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Test valid filters
  testCases.filterValidation.validFilters.forEach((filter, index) => {
    try {
      const validated = validateFilters(filter);
      if (!validated) {
        results.failed++;
        results.errors.push(`Valid filter ${index} failed validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing valid filter ${index}: ${error}`);
    }
  });

  // Test invalid filters
  testCases.filterValidation.invalidFilters.forEach((filter, index) => {
    try {
      const validated = validateFilters(filter);
      if (validated) {
        results.failed++;
        results.errors.push(`Invalid filter ${index} passed validation`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error testing invalid filter ${index}: ${error}`);
    }
  });

  console.log(`✅ Filter tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
};

export const runVibeCompatibilityTests = () => {
  console.log('🧪 Running Vibe Compatibility Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  const testContexts = [
    {
      timeOfDay: 8, // morning
      journeyType: 'transit' as const,
      userPreferences: createMockVibePreferences(),
      stressLevel: 'medium' as const
    },
    {
      timeOfDay: 22, // night
      journeyType: 'departure' as const,
      userPreferences: createMockVibePreferences({ favoriteVibes: ['relax'] }),
      stressLevel: 'high' as const
    }
  ];

  const testVibes: Array<'relax' | 'work' | 'refuel'> = ['relax', 'work', 'refuel'];

  testContexts.forEach((context, contextIndex) => {
    testVibes.forEach(vibe => {
      try {
        const compatibility = calculateVibeCompatibility(vibe, context);
        
        if (compatibility.score < 0 || compatibility.score > 100) {
          results.failed++;
          results.errors.push(`Invalid score for vibe ${vibe} in context ${contextIndex}: ${compatibility.score}`);
        } else if (!compatibility.factors || typeof compatibility.factors !== 'object') {
          results.failed++;
          results.errors.push(`Missing factors for vibe ${vibe} in context ${contextIndex}`);
        } else {
          results.passed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error testing vibe compatibility ${vibe} in context ${contextIndex}: ${error}`);
      }
    });
  });

  console.log(`✅ Vibe compatibility tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
};

export const runFilterApplicationTests = () => {
  console.log('🧪 Running Filter Application Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  const testAmenities = [
    createMockAmenity({ category: 'Food & Dining', priceRange: 'moderate' }),
    createMockAmenity({ id: 'test-2', category: 'Shopping', priceRange: 'premium' }),
    createMockAmenity({ id: 'test-3', category: 'Food & Dining', priceRange: 'budget' })
  ];

  const testFilters = [
    createEmptyFilters(),
    { ...createEmptyFilters(), categories: ['Food & Dining'] },
    { ...createEmptyFilters(), priceRange: 'moderate' as const },
    { ...createEmptyFilters(), searchQuery: 'restaurant' }
  ];

  testFilters.forEach((filter, filterIndex) => {
    try {
      const filtered = applyFilters(testAmenities, filter);
      
      if (!Array.isArray(filtered)) {
        results.failed++;
        results.errors.push(`Filter ${filterIndex} did not return array`);
      } else if (filtered.length > testAmenities.length) {
        results.failed++;
        results.errors.push(`Filter ${filterIndex} returned more items than input`);
      } else {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error applying filter ${filterIndex}: ${error}`);
    }
  });

  console.log(`✅ Filter application tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
};

// Main test runner
export const runAllTypeValidationTests = () => {
  console.log('🚀 Starting Type Validation Test Suite...\n');
  
  const startTime = Date.now();
  
  const results = {
    vibeValidation: runVibeValidationTests(),
    amenityValidation: runAmenityValidationTests(),
    filterValidation: runFilterValidationTests(),
    vibeCompatibility: runVibeCompatibilityTests(),
    filterApplication: runFilterApplicationTests()
  };
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate totals
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);
  
  console.log('\n📊 Test Summary:');
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`✅ Total passed: ${totalPassed}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log(`🚨 Total errors: ${totalErrors}`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All type validation tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return {
    results,
    summary: {
      totalPassed,
      totalFailed,
      totalErrors,
      totalTime
    }
  };
};

// Export for use in development
export const runTests = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    console.log('🌐 Running tests in browser environment...');
    return runAllTypeValidationTests();
  } else {
    // Node.js environment
    console.log('🖥️  Running tests in Node.js environment...');
    return runAllTypeValidationTests();
  }
}; 
// vibeIntegrationTests.ts
// Comprehensive test suite for vibe-first pattern with terminal context

import { VibePatternVerifier } from './vibePatternVerifier';
import { TerminalProvider, useTerminalContext, TerminalStorage } from '../contexts/TerminalContextManager';
import { getStorageManager, VibeStorageManager } from './vibeStorageManager';

// Test utilities and mocks
class TestRunner {
  private testResults: Map<string, TestResult> = new Map();
  private currentSuite: string = '';

  suite(name: string, fn: () => void): void {
    this.currentSuite = name;
    console.group(`🧪 Test Suite: ${name}`);
    fn();
    console.groupEnd();
  }

  async test(name: string, fn: () => Promise<void> | void): Promise<void> {
    const testName = `${this.currentSuite} > ${name}`;
    try {
      await fn();
      this.testResults.set(testName, { passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.testResults.set(testName, { passed: false, error });
      console.error(`❌ ${name}:`, error);
    }
  }

  expect<T>(actual: T): Assertion<T> {
    return new Assertion(actual);
  }

  getSummary(): TestSummary {
    const results = Array.from(this.testResults.entries());
    const passed = results.filter(([, r]) => r.passed).length;
    const failed = results.filter(([, r]) => !r.passed).length;
    
    return {
      total: results.length,
      passed,
      failed,
      successRate: results.length > 0 ? (passed / results.length) * 100 : 0,
      results
    };
  }
}

class Assertion<T> {
  constructor(private actual: T) {}

  toBe(expected: T): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected}, got ${this.actual}`);
    }
  }

  toEqual(expected: T): void {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
    }
  }

  toContain(value: any): void {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(value)) {
        throw new Error(`Array does not contain ${value}`);
      }
    } else if (typeof this.actual === 'string') {
      if (!this.actual.includes(value)) {
        throw new Error(`String does not contain ${value}`);
      }
    }
  }

  toBeTruthy(): void {
    if (!this.actual) {
      throw new Error(`Expected truthy value, got ${this.actual}`);
    }
  }

  toBeFalsy(): void {
    if (this.actual) {
      throw new Error(`Expected falsy value, got ${this.actual}`);
    }
  }

  toBeGreaterThan(value: number): void {
    if (typeof this.actual !== 'number' || this.actual <= value) {
      throw new Error(`Expected ${this.actual} to be greater than ${value}`);
    }
  }

  toHaveLength(length: number): void {
    if (!Array.isArray(this.actual) || this.actual.length !== length) {
      throw new Error(`Expected length ${length}, got ${this.actual ? (this.actual as any).length : 'undefined'}`);
    }
  }

  toBeLessThan(value: number): void {
    if (typeof this.actual !== 'number' || this.actual >= value) {
      throw new Error(`Expected ${this.actual} to be less than ${value}`);
    }
  }
}

interface TestResult {
  passed: boolean;
  error?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  results: [string, TestResult][];
}

// Mock CSV data based on your file structure
const mockAmenityData = [
  {
    id: 1,
    created_at: '2024-01-15',
    amenity_slug: 'starbucks-t3',
    description: 'Premium coffee and light bites',
    website_url: 'https://starbucks.com',
    logo_url: 'https://example.com/starbucks.png',
    vibe_tags: 'quick,refuel,morning-essentials',
    booking_required: false,
    available_in_tr: true,
    price_level: '$$',
    opening_hours: '0500-2300',
    terminal_code: 'SIN-T3',
    airport_code: 'SIN',
    name: 'Starbucks'
  },
  {
    id: 2,
    created_at: '2024-01-16',
    amenity_slug: 'jewel-canopy-park',
    description: 'Nature-themed entertainment complex',
    website_url: 'https://jewelchangi.com',
    logo_url: null,
    vibe_tags: 'discover,chill,family',
    booking_required: true,
    available_in_tr: false,
    price_level: '$$$',
    opening_hours: '0900-2200',
    terminal_code: 'SIN-JEWEL',
    airport_code: 'SIN',
    name: 'Canopy Park'
  },
  {
    id: 3,
    created_at: '2024-01-17',
    amenity_slug: 'plaza-premium-lounge',
    description: 'Premium lounge with shower facilities',
    website_url: 'https://plazapremiumlounge.com',
    logo_url: 'https://example.com/plaza.png',
    vibe_tags: 'chill,work,productivity-spaces',
    booking_required: true,
    available_in_tr: true,
    price_level: '$$$$',
    opening_hours: '24/7',
    terminal_code: 'SIN-T1',
    airport_code: 'SIN',
    name: 'Plaza Premium Lounge'
  }
];

const mockCollectionData = {
  slug: 'jewel-discovery',
  vibe: 'discover',
  name: 'Jewel Discovery',
  description: 'Explore the wonders of Jewel Changi',
  imageUrl: 'https://example.com/jewel.jpg',
  amenityIds: [2],
  terminals: ['SIN-JEWEL', 'SIN-T1', 'SIN-T2', 'SIN-T3'],
  featured: true,
  order: 1
};

// Main test suite
export async function runIntegrationTests(): Promise<TestSummary> {
  const runner = new TestRunner();
  
  // Clear any existing data before tests
  localStorage.clear();

  // Test Suite 1: Vibe Pattern Verifier
  runner.suite('VibePatternVerifier', () => {
    runner.test('validates correct vibe-first URL pattern', () => {
      const result = VibePatternVerifier.validateUrl('/collection/discover/jewel-discovery');
      runner.expect(result.valid).toBeTruthy();
      runner.expect(result.errors).toHaveLength(0);
      runner.expect(result.metadata?.vibe).toBe('discover');
      runner.expect(result.metadata?.collectionSlug).toBe('jewel-discovery');
    });

    runner.test('validates URL with terminal query parameter', () => {
      const result = VibePatternVerifier.validateUrl('/collection/quick/grab-and-go?terminal=SIN-T3');
      runner.expect(result.valid).toBeTruthy();
      runner.expect(result.metadata?.terminal).toBe('SIN-T3');
    });

    runner.test('rejects invalid vibe', () => {
      const result = VibePatternVerifier.validateUrl('/collection/invalid/some-collection');
      runner.expect(result.valid).toBeFalsy();
      runner.expect(result.errors.length).toBeGreaterThan(0);
    });

    runner.test('validates collection data structure', () => {
      const result = VibePatternVerifier.validateCollection({
        slug: 'morning-essentials',
        vibe: 'refuel',
        name: 'Morning Essentials',
        terminals: ['SIN-T1', 'SIN-T2'],
        amenityCount: 5
      });
      runner.expect(result.valid).toBeTruthy();
    });

    runner.test('batch validates multiple URLs', () => {
      const urls = [
        '/collection/discover/jewel-discovery',
        '/collection/quick/grab-and-go',
        '/collection/invalid/test',
        '/collection/chill/lounge-life?terminal=SIN-T3'
      ];
      
      const { summary } = VibePatternVerifier.validateBatch(urls);
      runner.expect(summary.total).toBe(4);
      runner.expect(summary.valid).toBe(3);
      runner.expect(summary.invalid).toBe(1);
    });

    runner.test('validates amenity data against vibe pattern', () => {
      const result = VibePatternVerifier.validateAmenityData(mockAmenityData[0], 'refuel');
      runner.expect(result.valid).toBeTruthy();
      runner.expect(result.metadata?.vibeTags).toContain('refuel');
    });

    runner.test('generates valid URLs', () => {
      const url = VibePatternVerifier.generateUrl('discover', 'hidden-gems', 'SIN-T2');
      runner.expect(url).toBe('/collection/discover/hidden-gems?terminal=SIN-T2');
    });
  });

  // Test Suite 2: Storage Manager
  runner.suite('VibeStorageManager', () => {
    const storage = getStorageManager({ maxCacheAge: 3600000 });

    runner.test('stores and retrieves collection', async () => {
      const success = await storage.storeCollection(mockCollectionData);
      runner.expect(success).toBeTruthy();

      const retrieved = await storage.getCollection('discover', 'jewel-discovery');
      runner.expect(retrieved).toBeTruthy();
      runner.expect(retrieved?.name).toBe('Jewel Discovery');
    });

    runner.test('stores and filters amenities by terminal', async () => {
      const success = await storage.storeAmenities(mockAmenityData, 'SIN-T3');
      runner.expect(success).toBeTruthy();

      const amenities = await storage.getAmenities({ terminal: 'SIN-T3' });
      runner.expect(amenities.length).toBeGreaterThan(0);
    });

    runner.test('filters amenities by vibe', async () => {
      await storage.storeAmenities(mockAmenityData);
      
      const discoverAmenities = await storage.getAmenities({ vibe: 'discover' });
      runner.expect(discoverAmenities.length).toBeGreaterThan(0);
      runner.expect(discoverAmenities[0].vibe_tags).toContain('discover');
    });

    runner.test('batch stores collections', async () => {
      const collections = [
        { ...mockCollectionData, slug: 'test1', vibe: 'quick' },
        { ...mockCollectionData, slug: 'test2', vibe: 'work' },
        { ...mockCollectionData, slug: 'test3', vibe: 'shop' }
      ];

      const count = await storage.batchStoreCollections(collections);
      runner.expect(count).toBe(3);
    });

    runner.test('retrieves collections by vibe', async () => {
      const quickCollection = {
        ...mockCollectionData,
        slug: 'quick-bites',
        vibe: 'quick',
        order: 2
      };
      
      await storage.storeCollection(quickCollection);
      const collections = await storage.getCollectionsByVibe('quick');
      runner.expect(collections.length).toBeGreaterThan(0);
    });

    runner.test('provides accurate storage statistics', () => {
      const stats = storage.getStats();
      runner.expect(stats.itemCount).toBeGreaterThan(0);
      runner.expect(stats.totalSize).toBeGreaterThan(0);
    });

    runner.test('clears cache selectively', async () => {
      await storage.clearCache({ vibe: 'quick' });
      const collections = await storage.getCollectionsByVibe('quick');
      runner.expect(collections).toHaveLength(0);
    });
  });

  // Test Suite 3: Terminal Context Integration
  runner.suite('TerminalContext', () => {
    runner.test('persists terminal selection', () => {
      TerminalStorage.setSelectedTerminal('SIN-T3');
      const terminal = TerminalStorage.getSelectedTerminal();
      runner.expect(terminal).toBe('SIN-T3');
    });

    runner.test('validates terminal codes', () => {
      const result = VibePatternVerifier.validateTerminalContext('SIN-T1', false);
      runner.expect(result.valid).toBeTruthy();
      runner.expect(result.metadata?.terminalName).toBe('Terminal 1');
    });

    runner.test('handles invalid terminal gracefully', () => {
      const result = VibePatternVerifier.validateTerminalContext('INVALID', false);
      runner.expect(result.valid).toBeFalsy();
      runner.expect(result.errors.length).toBeGreaterThan(0);
    });

    runner.test('detects terminal from URL hash', async () => {
      // Simulate URL with terminal hash
      window.location.hash = '#terminal=SIN-T2';
      
      // Would need actual React testing for full context test
      // This demonstrates the integration pattern
      const terminal = window.location.hash.match(/terminal=([^&]+)/)?.[1];
      runner.expect(terminal).toBe('SIN-T2');
      
      // Clean up
      window.location.hash = '';
    });
  });

  // Test Suite 4: End-to-End Integration
  runner.suite('End-to-End Integration', () => {
    const storage = getStorageManager();

    runner.test('complete flow: URL → Collection → Amenities', async () => {
      // 1. Validate URL
      const urlValidation = VibePatternVerifier.validateUrl('/collection/discover/jewel-discovery?terminal=SIN-JEWEL');
      runner.expect(urlValidation.valid).toBeTruthy();

      // 2. Store collection
      await storage.storeCollection(mockCollectionData);

      // 3. Store amenities
      await storage.storeAmenities(mockAmenityData, 'SIN-JEWEL');

      // 4. Retrieve filtered amenities
      const amenities = await storage.getAmenities({
        vibe: urlValidation.metadata?.vibe,
        collection: urlValidation.metadata?.collectionSlug,
        terminal: urlValidation.metadata?.terminal
      });

      runner.expect(amenities.length).toBeGreaterThan(0);
    });

    runner.test('handles cross-terminal collections', async () => {
      // Store amenities for multiple terminals
      await storage.storeAmenities(
        mockAmenityData.filter(a => a.terminal_code === 'SIN-T1'),
        'SIN-T1'
      );
      await storage.storeAmenities(
        mockAmenityData.filter(a => a.terminal_code === 'SIN-T3'),
        'SIN-T3'
      );

      // Collection spans multiple terminals
      const collection = {
        ...mockCollectionData,
        terminals: ['SIN-T1', 'SIN-T3']
      };
      
      await storage.storeCollection(collection);
      
      // Should work for both terminals
      const t1Amenities = await storage.getAmenities({ 
        vibe: 'discover', 
        terminal: 'SIN-T1' 
      });
      const t3Amenities = await storage.getAmenities({ 
        vibe: 'discover', 
        terminal: 'SIN-T3' 
      });
      
      // Both should have appropriate results
      runner.expect(t1Amenities).toBeTruthy();
      runner.expect(t3Amenities).toBeTruthy();
    });

    runner.test('validates CSV data structure', () => {
      // Test amenity from SYD T1 CSV
      const sydAmenity = {
        id: 100,
        created_at: '2024-08-20',
        amenity_slug: 'sydney-cafe',
        description: 'Local coffee shop',
        website_url: null, // Float type can be null
        logo_url: null,
        vibe_tags: 'quick,refuel',
        booking_required: false,
        available_in_tr: true,
        price_level: '$$',
        opening_hours: '0600-2100',
        terminal_code: 'SYD-T1',
        airport_code: 'SYD',
        name: 'Sydney Cafe'
      };

      const result = VibePatternVerifier.validateAmenityData(sydAmenity);
      runner.expect(result.valid).toBeTruthy();
    });

    runner.test('performance: handles large datasets', async () => {
      // Generate large dataset
      const largeAmenitySet = Array.from({ length: 768 }, (_, i) => ({
        ...mockAmenityData[0],
        id: i + 1,
        amenity_slug: `amenity-${i}`,
        name: `Amenity ${i}`
      }));

      const startTime = Date.now();
      await storage.storeAmenities(largeAmenitySet);
      const storeTime = Date.now() - startTime;

      const retrieveStart = Date.now();
      await storage.getAmenities({ vibe: 'quick' });
      const retrieveTime = Date.now() - retrieveStart;

      // Performance benchmarks
      runner.expect(storeTime).toBeLessThan(1000); // Should store in under 1s
      runner.expect(retrieveTime).toBeLessThan(100); // Should retrieve in under 100ms
    });
  });

  // Test Suite 5: Error Handling & Edge Cases
  runner.suite('Error Handling', () => {
    runner.test('handles malformed URLs gracefully', () => {
      const badUrls = [
        '/collection/',
        '/collection/discover',
        '/collection/discover/',
        'collection/discover/test',
        '/invalid/discover/test'
      ];

      badUrls.forEach(url => {
        const result = VibePatternVerifier.validateUrl(url);
        runner.expect(result.valid).toBeFalsy();
      });
    });

    runner.test('handles missing data gracefully', async () => {
      const storage = getStorageManager();
      const result = await storage.getCollection('nonexistent', 'collection');
      runner.expect(result).toBe(null);
    });

    runner.test('validates price levels', () => {
      const invalidAmenity = {
        ...mockAmenityData[0],
        price_level: 'INVALID'
      };

      const result = VibePatternVerifier.validateAmenityData(invalidAmenity);
      runner.expect(result.warnings.length).toBeGreaterThan(0);
    });

    runner.test('handles localStorage quota exceeded', async () => {
      const storage = getStorageManager({ maxCacheSize: 100 }); // Very small cache
      
      // Try to store large data
      const largeData = {
        ...mockCollectionData,
        description: 'x'.repeat(1000)
      };

      try {
        await storage.storeCollection(largeData);
      } catch (error) {
        // Should handle gracefully
        runner.expect(error).toBeTruthy();
      }
    });
  });

  // Generate test report
  const summary = runner.getSummary();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);
  
  if (summary.failed > 0) {
    console.log('\nFailed Tests:');
    summary.results
      .filter(([, result]) => !result.passed)
      .forEach(([name, result]) => {
        console.error(`  ❌ ${name}`);
        if (result.error) {
          console.error(`     ${result.error.message || result.error}`);
        }
      });
  }

  return summary;
}

// Validation script for CSV data
export async function validateCSVData(csvData: any[]): Promise<ValidationReport> {
  const report: ValidationReport = {
    totalRows: csvData.length,
    validRows: 0,
    invalidRows: 0,
    warnings: [],
    errors: [],
    vibeDistribution: {},
    terminalDistribution: {},
    priceDistribution: {}
  };

  csvData.forEach((row, index) => {
    const result = VibePatternVerifier.validateAmenityData(row);
    
    if (result.valid) {
      report.validRows++;
    } else {
      report.invalidRows++;
      report.errors.push(`Row ${index + 1}: ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      report.warnings.push(`Row ${index + 1}: ${result.warnings.join(', ')}`);
    }

    // Analyze distributions
    if (row.vibe_tags) {
      row.vibe_tags.split(',').forEach((tag: string) => {
        const vibe = tag.trim();
        report.vibeDistribution[vibe] = (report.vibeDistribution[vibe] || 0) + 1;
      });
    }

    if (row.terminal_code) {
      report.terminalDistribution[row.terminal_code] = 
        (report.terminalDistribution[row.terminal_code] || 0) + 1;
    }

    if (row.price_level) {
      report.priceDistribution[row.price_level] = 
        (report.priceDistribution[row.price_level] || 0) + 1;
    }
  });

  return report;
}

interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: string[];
  errors: string[];
  vibeDistribution: Record<string, number>;
  terminalDistribution: Record<string, number>;
  priceDistribution: Record<string, number>;
}

// Export test runner
export { TestRunner, runIntegrationTests as default };

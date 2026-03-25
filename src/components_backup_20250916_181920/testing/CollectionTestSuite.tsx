// src/components/testing/CollectionTestSuite.tsx

import React, { useState, useEffect } from 'react';
import { StorageManager } from '../../utils/storageManager';
import { CollectionVerifier, VIBES } from '../../utils/collectionVerifier';
import { VibePatternVerifier } from '../../utils/vibePatternVerifier';
import { getStorageManager } from '../../utils/vibeStorageManager';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  timestamp?: number;
}

interface TestFlow {
  id: string;
  name: string;
  steps: Array<{
    description: string;
    action: () => Promise<boolean>;
    verify: () => boolean;
  }>;
}

export const CollectionTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string>('discover');

  const testFlows: TestFlow[] = [
    {
      id: 'storage-clear',
      name: 'Clear Browser Storage',
      steps: [
        {
          description: 'Clear collection data (preserve terminal)',
          action: async () => {
            StorageManager.clearCollectionData();
            return true;
          },
          verify: () => {
            const stored = sessionStorage.getItem('selectedCollection');
            return stored === null;
          }
        }
      ]
    },
    {
      id: 'terminal-context',
      name: 'Terminal Context',
      steps: [
        {
          description: 'Set terminal context to SIN-T3',
          action: async () => {
            StorageManager.setTerminalContext({
              code: 'SIN-T3',
              name: 'Terminal 3',
              airport: 'Singapore Changi',
              lastUpdated: Date.now()
            });
            return true;
          },
          verify: () => {
            const terminal = StorageManager.getTerminalContext();
            return terminal?.code === 'SIN-T3';
          }
        }
      ]
    },
    {
      id: 'vibe-navigation',
      name: 'Vibe-First Navigation',
      steps: [
        {
          description: 'Navigate to Discover vibe',
          action: async () => {
            window.history.pushState({}, '', '/collection/discover/jewel-discovery');
            return true;
          },
          verify: () => {
            const path = window.location.pathname;
            return path === '/collection/discover/jewel-discovery';
          }
        },
        {
          description: 'Store collection context',
          action: async () => {
            StorageManager.setCollectionContext({
              vibe: 'discover',
              slug: 'jewel-discovery',
              name: 'Jewel Discovery',
              gradient: 'from-purple-500 to-pink-500'
            });
            return true;
          },
          verify: () => {
            const context = StorageManager.getCollectionContext();
            return context?.vibe === 'discover' && 
                   context?.slug === 'jewel-discovery';
          }
        },
        {
          description: 'Validate route matches storage',
          action: async () => {
            const validation = StorageManager.validateRoute(window.location.pathname);
            return validation.valid;
          },
          verify: () => {
            const validation = StorageManager.validateRoute(window.location.pathname);
            return validation.valid && validation.issues.length === 0;
          }
        }
      ]
    },
    {
      id: 'collection-verification',
      name: 'Collection Verification',
      steps: [
        {
          description: 'Verify jewel-discovery exists in discover vibe',
          action: async () => {
            const result = CollectionVerifier.verifyCollection('discover', 'jewel-discovery');
            return result.exists && result.correctVibe;
          },
          verify: () => {
            const vibe = CollectionVerifier.getVibeForCollection('jewel-discovery');
            return vibe === 'discover';
          }
        },
        {
          description: 'Verify all vibe structure',
          action: async () => {
            const result = CollectionVerifier.verifyAllCollections();
            return result.isValid;
          },
          verify: () => {
            const vibes = CollectionVerifier.getVibes();
            return vibes.length > 0 && vibes.includes('discover');
          }
        }
      ]
    },
    {
      id: 'cross-vibe-navigation',
      name: 'Cross-Vibe Navigation',
      steps: [
        {
          description: 'Navigate from Discover to Refuel',
          action: async () => {
            // First set discover
            window.history.pushState({}, '', '/collection/discover/jewel-discovery');
            StorageManager.setCollectionContext({
              vibe: 'discover',
              slug: 'jewel-discovery',
              name: 'Jewel Discovery'
            });
            
            // Then navigate to refuel
            window.history.pushState({}, '', '/collection/refuel/morning-essentials');
            StorageManager.setCollectionContext({
              vibe: 'refuel',
              slug: 'morning-essentials',
              name: 'Morning Essentials'
            });
            return true;
          },
          verify: () => {
            const context = StorageManager.getCollectionContext();
            const path = window.location.pathname;
            return context?.vibe === 'refuel' && 
                   path.includes('morning-essentials');
          }
        }
      ]
    },
    {
      id: 'context-persistence',
      name: 'Context Persistence',
      steps: [
        {
          description: 'Verify terminal context persists across navigation',
          action: async () => {
            // Navigate through multiple collections
            const navigations = [
              '/collection/discover/hidden-gems',
              '/collection/quick/grab-and-go',
              '/collection/chill/lounge-life'
            ];
            
            for (const path of navigations) {
              window.history.pushState({}, '', path);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return true;
          },
          verify: () => {
            // Terminal should still be SIN-T3
            const terminal = StorageManager.getTerminalContext();
            return terminal?.code === 'SIN-T3';
          }
        }
      ]
    },
    {
      id: 'url-pattern-validation',
      name: 'URL Pattern Validation',
      steps: [
        {
          description: 'Validate correct vibe-first URL patterns',
          action: async () => {
            const validUrls = [
              '/collection/discover/jewel-discovery',
              '/collection/refuel/morning-essentials',
              '/collection/chill/lounge-life'
            ];
            
            const results = validUrls.map(url => VibePatternVerifier.validateUrl(url));
            return results.every(r => r.valid);
          },
          verify: () => {
            const validUrls = [
              '/collection/discover/jewel-discovery',
              '/collection/refuel/morning-essentials'
            ];
            
            const results = validUrls.map(url => VibePatternVerifier.validateUrl(url));
            return results.every(r => r.valid && r.errors.length === 0);
          }
        },
        {
          description: 'Reject invalid URL patterns',
          action: async () => {
            const invalidUrls = [
              '/collection/invalid-vibe/jewel-discovery',
              '/collection/discover/invalid-collection',
              '/collection/discover',
              '/collection'
            ];
            
            const results = invalidUrls.map(url => VibePatternVerifier.validateUrl(url));
            return results.every(r => !r.valid);
          },
          verify: () => {
            const invalidUrls = [
              '/collection/invalid-vibe/jewel-discovery',
              '/collection/discover/invalid-collection'
            ];
            
            const results = invalidUrls.map(url => VibePatternVerifier.validateUrl(url));
            return results.every(r => !r.valid && r.errors.length > 0);
          }
        }
      ]
    },
    {
      id: 'vibe-storage-manager',
      name: 'Vibe Storage Manager',
      steps: [
        {
          description: 'Store and retrieve collections with vibe context',
          action: async () => {
            const storageManager = getStorageManager();
            
            const testCollection = {
              slug: 'test-collection',
              vibe: 'discover',
              name: 'Test Collection',
              description: 'A test collection for storage testing',
              amenityIds: [1, 2, 3],
              featured: false,
              order: 1
            };
            
            const stored = await storageManager.storeCollection(testCollection);
            if (!stored) return false;
            
            const retrieved = await storageManager.getCollection('discover', 'test-collection');
            return retrieved && retrieved.slug === 'test-collection';
          },
          verify: () => {
            const storageManager = getStorageManager();
            const collection = storageManager.getCollection('discover', 'test-collection');
            return collection !== null;
          }
        },
        {
          description: 'Store and retrieve amenities with terminal context',
          action: async () => {
            const storageManager = getStorageManager();
            
            const testAmenities = [
              {
                id: 1,
                created_at: new Date().toISOString(),
                amenity_slug: 'test-amenity',
                description: 'A test amenity',
                vibe_tags: 'discover,test',
                booking_required: false,
                available_in_tr: true,
                price_level: '$',
                opening_hours: '24/7',
                terminal_code: 'SIN-T3',
                airport_code: 'SIN',
                name: 'Test Amenity'
              }
            ];
            
            const stored = await storageManager.storeAmenities(testAmenities, 'SIN-T3');
            if (!stored) return false;
            
            const retrieved = await storageManager.getAmenities({ terminal: 'SIN-T3' });
            return retrieved.length > 0 && retrieved[0].id === 1;
          },
          verify: () => {
            const storageManager = getStorageManager();
            const amenities = storageManager.getAmenities({ terminal: 'SIN-T3' });
            return amenities.length > 0;
          }
        },
        {
          description: 'Get collections by vibe',
          action: async () => {
            const storageManager = getStorageManager();
            
            // Store multiple collections for discover vibe
            const collections = [
              {
                slug: 'collection-1',
                vibe: 'discover',
                name: 'Collection 1',
                description: 'First collection',
                amenityIds: [1, 2],
                featured: true,
                order: 1
              },
              {
                slug: 'collection-2',
                vibe: 'discover',
                name: 'Collection 2',
                description: 'Second collection',
                amenityIds: [3, 4],
                featured: false,
                order: 2
              }
            ];
            
            for (const collection of collections) {
              await storageManager.storeCollection(collection);
            }
            
            const vibeCollections = await storageManager.getCollectionsByVibe('discover');
            return vibeCollections.length >= 2;
          },
          verify: () => {
            const storageManager = getStorageManager();
            const collections = storageManager.getCollectionsByVibe('discover');
            return collections.length >= 2;
          }
        }
      ]
    },
    {
      id: 'supabase-mvp',
      name: 'Supabase MVP Integration',
      steps: [
        {
          description: 'Load MVP configuration and collections',
          action: async () => {
            try {
              const { getMVPConfig } = await import('../../utils/supabaseMVPIntegration');
              const { MVP_CONFIG, MVP_COLLECTIONS } = getMVPConfig();
              
              // Verify MVP configuration
              if (MVP_CONFIG.AIRPORT_CODE !== 'SIN') return false;
              if (MVP_CONFIG.TERMINALS.length !== 5) return false;
              if (MVP_COLLECTIONS.length < 5) return false;
              
              return true;
            } catch (error) {
              console.error('Failed to load MVP config:', error);
              return false;
            }
          },
          verify: () => {
            try {
              const { getMVPConfig } = require('../../utils/supabaseMVPIntegration');
              const { MVP_CONFIG, MVP_COLLECTIONS } = getMVPConfig();
              return MVP_CONFIG && MVP_COLLECTIONS;
            } catch {
              return false;
            }
          }
        },
        {
          description: 'Test collection structure and vibe mapping',
          action: async () => {
            const { getMVPConfig } = await import('../../utils/supabaseMVPIntegration');
            const { MVP_COLLECTIONS } = getMVPConfig();
            
            // Test vibe distribution
            const discoverCollections = MVP_COLLECTIONS.filter(c => c.vibe === 'discover');
            const quickCollections = MVP_COLLECTIONS.filter(c => c.vibe === 'quick');
            const refuelCollections = MVP_COLLECTIONS.filter(c => c.vibe === 'refuel');
            
            if (discoverCollections.length < 2) return false;
            if (quickCollections.length < 1) return false;
            if (refuelCollections.length < 1) return false;
            
            return true;
          },
          verify: () => {
            try {
              const { getMVPConfig } = require('../../utils/supabaseMVPIntegration');
              const { MVP_COLLECTIONS } = getMVPConfig();
              return MVP_COLLECTIONS.some(c => c.vibe === 'discover') &&
                     MVP_COLLECTIONS.some(c => c.vibe === 'quick') &&
                     MVP_COLLECTIONS.some(c => c.vibe === 'refuel');
            } catch {
              return false;
            }
          }
        },
        {
          description: 'Test terminal mapping and collection availability',
          action: async () => {
            const { getMVPConfig } = await import('../../utils/supabaseMVPIntegration');
            const { MVP_COLLECTIONS } = getMVPConfig();
            
            // Test Jewel Discovery collection
            const jewelCollection = MVP_COLLECTIONS.find(c => c.slug === 'jewel-discovery');
            if (!jewelCollection) return false;
            if (!jewelCollection.terminals.includes('SIN-JEWEL')) return false;
            if (jewelCollection.vibe !== 'discover') return false;
            
            // Test Grab & Go collection
            const grabCollection = MVP_COLLECTIONS.find(c => c.slug === 'grab-and-go');
            if (!grabCollection) return false;
            if (grabCollection.vibe !== 'quick') return false;
            
            return true;
          },
          verify: () => {
            try {
              const { getMVPConfig } = require('../../utils/supabaseMVPIntegration');
              const { MVP_COLLECTIONS } = getMVPConfig();
              
              const jewelCollection = MVP_COLLECTIONS.find(c => c.slug === 'jewel-discovery');
              const grabCollection = MVP_COLLECTIONS.find(c => c.slug === 'grab-and-go');
              
              return jewelCollection && grabCollection &&
                     jewelCollection.terminals.includes('SIN-JEWEL') &&
                     grabCollection.vibe === 'quick';
            } catch {
              return false;
            }
          }
        }
      ]
    }
  ];

  const runTest = async (flow: TestFlow) => {
    const result: TestResult = {
      testName: flow.name,
      status: 'running',
      timestamp: Date.now()
    };

    setTestResults(prev => [...prev, result]);

    try {
      for (const step of flow.steps) {
        console.log(`🧪 Running: ${step.description}`);
        const actionSuccess = await step.action();
        const verifySuccess = step.verify();

        if (!actionSuccess || !verifySuccess) {
          throw new Error(`Failed at step: ${step.description}`);
        }
      }

      result.status = 'passed';
      result.message = 'All steps completed successfully';
    } catch (error) {
      result.status = 'failed';
      result.message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Test failed: ${flow.name}`, error);
    }

    setTestResults(prev => 
      prev.map(r => r.testName === result.testName ? result : r)
    );

    return result;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const flow of testFlows) {
      await runTest(flow);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'passed': return '✅';
      case 'failed': return '❌';
    }
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      results: testResults,
      diagnostics: StorageManager.getDiagnostics(),
      vibeStructure: VIBES
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-collection-test-${Date.now()}.json`;
    a.click();
  };

  // Set up console helpers
  useEffect(() => {
    (window as any).testCollections = {
      // Storage operations
      clearStorage: () => StorageManager.clearStorage(),
      clearCollections: () => StorageManager.clearCollectionData(),
      
      // Terminal operations
      setTerminal: (code: string) => StorageManager.setTerminalContext({
        code,
        name: `Terminal ${code.split('-')[1]}`,
        airport: code.split('-')[0],
        lastUpdated: Date.now()
      }),
      getTerminal: () => StorageManager.getTerminalContext(),
      
      // Collection operations
      setCollection: (vibe: string, slug: string) => StorageManager.setCollectionContext({
        vibe,
        slug,
        name: CollectionVerifier.getDisplayName(slug)
      }),
      getCollection: () => StorageManager.getCollectionContext(),
      
      // Verification
      verify: () => CollectionVerifier.verifyAllCollections(),
      validateRoute: () => StorageManager.validateRoute(window.location.pathname),
      getVibeMap: () => console.log(CollectionVerifier.getVisualMap()),
      
      // URL Pattern Validation
      validateUrl: (url: string) => VibePatternVerifier.validateUrl(url),
      validateBatch: (urls: string[]) => VibePatternVerifier.validateBatch(urls),
      generateUrl: (vibe: string, collection: string, terminal?: string) => 
        VibePatternVerifier.generateUrl(vibe, collection, terminal),
      
      // Vibe Storage Manager
      getStorageManager: () => getStorageManager(),
      storageStats: () => getStorageManager().getStats(),
      clearStorageCache: (options?: any) => getStorageManager().clearCache(options),
      
      // Storage Examples
      runStorageExamples: async () => {
        const { runAllExamples } = await import('../../examples/vibeStorageUsage');
        return runAllExamples();
      },
      runCollectionExample: async () => {
        const { collectionStorageExample } = await import('../../examples/vibeStorageUsage');
        return collectionStorageExample();
      },
      runAmenityExample: async () => {
        const { amenityStorageExample } = await import('../../examples/vibeStorageUsage');
        return amenityStorageExample();
      },
      
      // Integration Tests
      runIntegrationTests: async () => {
        const { runIntegrationTests } = await import('../../utils/vibeIntegrationTests');
        return runIntegrationTests();
      },
      validateCSVData: async (csvData: any[]) => {
        const { validateCSVData } = await import('../../utils/vibeIntegrationTests');
        return validateCSVData(csvData);
      },
      
      // Supabase MVP Integration
      getSupabaseService: (url: string, key: string) => {
        const { SupabaseMVPService } = require('../../utils/supabaseMVPIntegration');
        return new SupabaseMVPService(url, key);
      },
      getMVPConfig: () => {
        const { MVP_CONFIG, MVP_COLLECTIONS } = require('../../utils/supabaseMVPIntegration');
        return { MVP_CONFIG, MVP_COLLECTIONS };
      },
      testMVPCollections: () => {
        const { MVP_COLLECTIONS } = require('../../utils/supabaseMVPIntegration');
        console.log('🏗️  MVP Collections:');
        MVP_COLLECTIONS.forEach(c => {
          console.log(`  ${c.vibe}/${c.slug}: ${c.name} (${c.terminals.join(', ')})`);
        });
      },
      testMVPTerminals: () => {
        const { MVP_CONFIG } = require('../../utils/supabaseMVPIntegration');
        console.log('✈️  MVP Terminals:');
        Object.entries(MVP_CONFIG.TERMINAL_NAMES).forEach(([code, name]) => {
          console.log(`  ${code}: ${name}`);
        });
      },
      
      // Navigation context
      getContext: () => StorageManager.getNavigationContext(),
      diagnostics: () => StorageManager.getDiagnostics(),
      
      // Auto-fix
      autoFix: () => CollectionVerifier.autoFix()
    };

    console.log('🧪 Vibe Collection test tools loaded. Access via window.testCollections');
    console.log('📚 Quick commands:');
    console.log('  - testCollections.getVibeMap() - See all vibes and collections');
    console.log('  - testCollections.setTerminal("SIN-T3") - Set terminal');
    console.log('  - testCollections.setCollection("discover", "jewel-discovery") - Set collection');
    console.log('  - testCollections.getContext() - See full navigation context');
    console.log('🔗 URL Validation:');
    console.log('  - testCollections.validateUrl("/collection/discover/jewel-discovery") - Validate URL');
    console.log('  - testCollections.generateUrl("discover", "jewel-discovery", "SIN-T3") - Generate URL');
    console.log('💾 Storage Management:');
    console.log('  - testCollections.storageStats() - Get storage statistics');
    console.log('  - testCollections.clearStorageCache({ all: true }) - Clear all cache');
    console.log('📚 Storage Examples:');
    console.log('  - testCollections.runStorageExamples() - Run all storage examples');
    console.log('  - testCollections.runCollectionExample() - Run collection example');
    console.log('  - testCollections.runAmenityExample() - Run amenity example');
    console.log('🧪 Integration Tests:');
    console.log('  - testCollections.runIntegrationTests() - Run all integration tests');
    console.log('  - testCollections.validateCSVData(csvData) - Validate CSV data');
    console.log('🏗️  Supabase MVP Integration:');
    console.log('  - testCollections.getMVPConfig() - Get MVP configuration');
    console.log('  - testCollections.testMVPCollections() - Test MVP collections');
    console.log('  - testCollections.testMVPTerminals() - Test MVP terminals');

    return () => {
      delete (window as any).testCollections;
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h2>🧪 Vibe-First Collection Test Suite</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.5 : 1
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button 
          onClick={() => StorageManager.clearCollectionData()}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Collections
        </button>
        
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
        
        <button 
          onClick={exportResults}
          disabled={testResults.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testResults.length === 0 ? 'not-allowed' : 'pointer',
            opacity: testResults.length === 0 ? 0.5 : 1
          }}
        >
          Export Results
        </button>
      </div>

      {/* Vibe Explorer */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px' 
      }}>
        <h3>🎨 Vibe Explorer</h3>
        <div style={{ marginTop: '10px' }}>
          <select 
            value={selectedVibe} 
            onChange={(e) => setSelectedVibe(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            {Object.keys(VIBES).map(vibe => (
              <option key={vibe} value={vibe}>
                {CollectionVerifier.getDisplayName(vibe)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: '10px' }}>
          <strong>Collections in {selectedVibe}:</strong>
          <ul style={{ marginTop: '5px' }}>
            {CollectionVerifier.getCollectionsForVibe(selectedVibe).map(collection => (
              <li key={collection} style={{ marginLeft: '20px' }}>
                {CollectionVerifier.getDisplayName(collection)}
                <button
                  onClick={() => {
                    window.history.pushState({}, '', `/collection/${selectedVibe}/${collection}`);
                    StorageManager.setCollectionContext({
                      vibe: selectedVibe,
                      slug: collection,
                      name: CollectionVerifier.getDisplayName(collection)
                    });
                    console.log(`📍 Navigated to: /collection/${selectedVibe}/${collection}`);
                  }}
                  style={{
                    marginLeft: '10px',
                    fontSize: '0.8em',
                    padding: '2px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Navigate
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p>No tests run yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {testResults.map((result, index) => (
              <li key={index} style={{ 
                padding: '10px', 
                marginBottom: '5px',
                backgroundColor: result.status === 'passed' ? '#d4edda' : 
                               result.status === 'failed' ? '#f8d7da' : 
                               result.status === 'running' ? '#fff3cd' : '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span>{getStatusIcon(result.status)}</span>
                <strong style={{ marginLeft: '10px' }}>{result.testName}</strong>
                {result.message && (
                  <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                    - {result.message}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDebug && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.85em'
        }}>
          <h3>Debug Information</h3>
          <pre>{JSON.stringify(StorageManager.getDiagnostics(), null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>📋 Vibe-First Testing Checklist</h3>
        <ul>
          <li>☐ Clear collection storage (preserves terminal)</li>
          <li>☐ Set terminal context (e.g., SIN-T3)</li>
          <li>☐ Navigate to a vibe (e.g., /collection/discover/...)</li>
          <li>☐ Select a collection (e.g., jewel-discovery)</li>
          <li>☐ Verify URL: /collection/[vibe]/[collection]</li>
          <li>☐ Verify collection matches vibe</li>
          <li>☐ Check terminal context persists</li>
          <li>☐ Test cross-vibe navigation</li>
          <li>☐ Verify amenities filtered by terminal</li>
          <li>☐ Check browser console for errors</li>
        </ul>
      </div>
    </div>
  );
};

// Hook for using in other components
export const useCollectionTest = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    // Run diagnostics on mount
    setDiagnostics(StorageManager.getDiagnostics());
    return () => {};
  }, []);

  return { diagnostics };
};

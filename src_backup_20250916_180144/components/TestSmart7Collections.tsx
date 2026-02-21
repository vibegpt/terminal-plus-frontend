import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smart7Badge } from './Smart7Badge';
import { supabase } from '../services/supabaseClient';

interface TestCollection {
  id: string;
  collection_id: string;
  name: string;
  amenity_count: number;
  vibe_category?: string;
}

interface TestResult {
  collection: string;
  total_available: number;
  smart7_selected: number;
  selections: Array<{
    position: number;
    name: string;
    terminal: string;
    vibe_tags: string;
    priority_score: number;
    is_featured: boolean;
    smart7_score?: number;
  }>;
  diversity_check: {
    terminals: number;
    featured_count: number;
    priority_range: string;
    vibe_diversity: number;
  };
  performance: {
    load_time: number;
    cache_hit: boolean;
    algorithm_version: string;
  };
}

export const TestSmart7Collections: React.FC = () => {
  const [collections, setCollections] = useState<TestCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  
  // Load available collections
  useEffect(() => {
    loadCollections();
  }, []);
  
  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('collections')
        .select(`
          id,
          collection_id,
          name,
          collection_amenities!inner(
            amenity_detail_id
          )
        `)
        .eq('collection_amenities.amenity_detail.airport_code', 'SIN')
        .order('name');
      
      if (supabaseError) throw supabaseError;
      
      if (data) {
        // Transform and count amenities per collection
        const collectionsWithCounts = data.map(c => ({
          ...c,
          amenity_count: c.collection_amenities?.length || 0,
          vibe_category: getVibeCategoryFromSlug(c.collection_id)
        }));
        
        setCollections(collectionsWithCounts);
        
        // Auto-select first collection with amenities
        const firstWithAmenities = collectionsWithCounts.find(c => c.amenity_count > 0);
        if (firstWithAmenities) {
          setSelectedCollectionId(firstWithAmenities.id);
        }
      }
    } catch (err: any) {
      console.error('Error loading collections:', err);
      setError(err.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };
  
  // Test Smart7 selection for selected collection
  const testSmart7 = async () => {
    if (!selectedCollectionId) return;
    
    const collection = collections.find(c => c.id === selectedCollectionId);
    if (!collection) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      // Test context
      const testContext = {
        collectionId: parseInt(selectedCollectionId),
        userTerminal: 'T3',
        timeOfDay: new Date().getHours(),
        pricePreference: 'any',
        layoverDuration: 120
      };
      
      // Test Smart7 selection
      const results = await testSmart7Selection(testContext);
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Create test result
      const testResult: TestResult = {
        ...results,
        performance: {
          load_time: loadTime,
          cache_hit: false, // Would be true if using cache
          algorithm_version: '1.0.0'
        }
      };
      
      setTestResults(testResult);
      
      // Add to test history
      setTestHistory(prev => [testResult, ...prev.slice(0, 4)]);
      
    } catch (err: any) {
      console.error('Smart7 test error:', err);
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };
  
  const testSmart7Selection = async (context: any): Promise<Omit<TestResult, 'performance'>> => {
    try {
      // Get amenities for this collection
      const { data: amenities, error: supabaseError } = await supabase
        .from('collection_amenities')
        .select(`
          priority,
          is_featured,
          amenity_detail!inner(
            id,
            name,
            vibe_tags,
            terminal_code,
            price_level,
            rating,
            review_count
          )
        `)
        .eq('collection_id', context.collectionId)
        .eq('amenity_detail.airport_code', 'SIN')
        .order('priority', { ascending: false })
        .limit(50); // Get more for better selection
      
      if (supabaseError) throw supabaseError;
      
      if (amenities && amenities.length > 0) {
        // Apply enhanced Smart7 selection logic
        const smart7Results = applySmart7Selection(amenities, context);
        
        // Calculate diversity metrics
        const terminals = [...new Set(smart7Results.map(r => r.terminal))];
        const priorityScores = smart7Results.map(r => r.priority_score);
        const vibeTags = smart7Results.flatMap(r => 
          r.vibe_tags ? r.vibe_tags.split(',').map(t => t.trim()) : []
        );
        
        return {
          collection: collections.find(c => c.id === selectedCollectionId)?.name || 'Unknown',
          total_available: amenities.length,
          smart7_selected: smart7Results.length,
          selections: smart7Results,
          diversity_check: {
            terminals: terminals.length,
            featured_count: smart7Results.filter(r => r.is_featured).length,
            priority_range: `${Math.min(...priorityScores)} - ${Math.max(...priorityScores)}`,
            vibe_diversity: new Set(vibeTags).size
          }
        };
      }
      
      throw new Error('No amenities found for collection');
      
    } catch (error: any) {
      throw new Error(`Smart7 selection failed: ${error.message}`);
    }
  };
  
  const applySmart7Selection = (amenities: any[], context: any) => {
    // Enhanced scoring algorithm
    const scoredAmenities = amenities.map(amenity => {
      let score = amenity.priority || 50;
      
      // Boost featured items
      if (amenity.is_featured) score += 25;
      
      // Terminal proximity boost
      if (amenity.terminal_code === context.userTerminal) {
        score += 20;
      }
      
      // Time relevance boost
      const hour = context.timeOfDay;
      if (hour >= 6 && hour <= 10) { // Morning
        if (amenity.vibe_tags?.includes('breakfast') || amenity.vibe_tags?.includes('morning')) {
          score += 15;
        }
      } else if (hour >= 11 && hour <= 14) { // Lunch
        if (amenity.vibe_tags?.includes('lunch') || amenity.vibe_tags?.includes('food')) {
          score += 15;
        }
      } else if (hour >= 17 && hour <= 20) { // Dinner
        if (amenity.vibe_tags?.includes('dinner') || amenity.vibe_tags?.includes('food')) {
          score += 15;
        }
      }
      
      // Rating boost
      if (amenity.rating && amenity.review_count > 10) {
        score += Math.min(10, amenity.rating * 2);
      }
      
      return {
        ...amenity,
        smart7_score: Math.min(100, score)
      };
    });
    
    // Sort by score and apply diversity rules
    const sorted = scoredAmenities.sort((a, b) => b.smart7_score - a.smart7_score);
    
    // Apply diversity rules
    const selected: any[] = [];
    const usedTerminals = new Set<string>();
    const usedVibes = new Set<string>();
    
    for (const amenity of sorted) {
      if (selected.length >= 7) break;
      
      const terminal = amenity.terminal_code;
      const vibes = amenity.vibe_tags?.split(',').map((t: string) => t.trim()) || [];
      
      // Check diversity constraints
      const terminalDiversity = usedTerminals.size < 3 || !usedTerminals.has(terminal);
      const vibeDiversity = usedVibes.size < 5 || vibes.some(v => !usedVibes.has(v));
      
      if (terminalDiversity && vibeDiversity) {
        selected.push({
          position: selected.length + 1,
          name: amenity.amenity_detail.name,
          terminal: amenity.amenity_detail.terminal_code,
          vibe_tags: amenity.amenity_detail.vibe_tags,
          priority_score: amenity.priority,
          is_featured: amenity.is_featured,
          smart7_score: amenity.smart7_score
        });
        
        usedTerminals.add(terminal);
        vibes.forEach(v => usedVibes.add(v));
      }
    }
    
    // Fill remaining slots if needed
    while (selected.length < 7 && selected.length < sorted.length) {
      const remaining = sorted.filter(s => 
        !selected.some(sel => sel.name === s.amenity_detail.name)
      );
      
      if (remaining.length === 0) break;
      
      const next = remaining[0];
      selected.push({
        position: selected.length + 1,
        name: next.amenity_detail.name,
        terminal: next.amenity_detail.terminal_code,
        vibe_tags: next.amenity_detail.vibe_tags,
        priority_score: next.priority,
        is_featured: next.is_featured,
        smart7_score: next.smart7_score
      });
    }
    
    return selected;
  };
  
  const getVibeCategoryFromSlug = (slug: string): string => {
    const vibeMap: Record<string, string> = {
      'lounges-affordable': 'comfort',
      'sleep-pods': 'comfort',
      'post-red-eye-recovery': 'comfort',
      'hidden-quiet-spots': 'chill',
      'gardens-at-dawn': 'chill',
      'peaceful-corners': 'chill',
      'local-food-real-prices': 'refuel',
      'coffee-worth-walk': 'refuel',
      'hawker-heaven': 'refuel',
      'work-spots-real-wifi': 'work',
      'meeting-ready-spaces': 'work',
      'quiet-zones': 'work',
      'quick-bites': 'quick',
      'gate-essentials': 'quick',
      '2-minute-stops': 'quick',
      'only-at-changi': 'exclusive',
      'singapore-exclusives': 'exclusive',
      'changi-exclusives': 'exclusive'
    };
    
    return vibeMap[slug] || 'general';
  };
  
  const getVibeColor = (category: string): string => {
    const colors: Record<string, string> = {
      comfort: 'from-blue-400 to-indigo-600',
      chill: 'from-green-400 to-emerald-600',
      refuel: 'from-orange-400 to-red-600',
      work: 'from-purple-400 to-pink-600',
      quick: 'from-yellow-400 to-orange-600',
      exclusive: 'from-pink-400 to-rose-600',
      general: 'from-gray-400 to-gray-600'
    };
    
    return colors[category] || colors.general;
  };
  
  const clearResults = () => {
    setTestResults(null);
    setError(null);
  };
  
  const exportResults = () => {
    if (!testResults) return;
    
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart7-test-${testResults.collection}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Smart7Badge size="lg" variant="premium" />
            <h1 className="text-3xl font-bold text-gray-900">Smart7 Collection Integration Test</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test and validate Smart7 selections for Singapore airport collections. 
            Monitor performance, diversity, and selection quality.
          </p>
        </div>
        
        {/* Collection Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Select Collection to Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Choose a collection...</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.amenity_count} amenities)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={testSmart7}
                disabled={!selectedCollectionId || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Testing...
                  </div>
                ) : (
                  '🚀 Test Smart7 Selection'
                )}
              </button>
            </div>
          </div>
          
          {/* Collection Stats */}
          {collections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Collection Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{collections.length}</div>
                  <div className="text-xs text-gray-600">Total Collections</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {collections.filter(c => c.amenity_count > 0).length}
                  </div>
                  <div className="text-xs text-gray-600">With Amenities</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {collections.reduce((sum, c) => sum + c.amenity_count, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Amenities</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(collections.reduce((sum, c) => sum + c.amenity_count, 0) / collections.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg per Collection</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Test Results */}
        <AnimatePresence>
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <span className="mr-2">📊</span>
                  Smart7 Test Results
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={exportResults}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📥 Export
                  </button>
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{testResults.collection}</div>
                  <div className="text-xs text-gray-600">Collection</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.total_available} / {testResults.smart7_selected}
                  </div>
                  <div className="text-xs text-gray-600">Available/Selected</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.diversity_check.terminals}
                  </div>
                  <div className="text-xs text-gray-600">Terminal Diversity</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.diversity_check.featured_count}
                  </div>
                  <div className="text-xs text-gray-600">Featured Items</div>
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold mb-3 flex items-center">
                  <span className="mr-2">⚡</span>
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Load Time:</span>
                    <span className="ml-2 font-medium">{testResults.performance.load_time}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache Hit:</span>
                    <span className="ml-2 font-medium">{testResults.performance.cache_hit ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="ml-2 font-medium">v{testResults.performance.algorithm_version}</span>
                  </div>
                </div>
              </div>
              
              {/* Selected Amenities */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Selected Amenities
                </h3>
                <div className="space-y-3">
                  {testResults.selections.map((item) => (
                    <motion.div
                      key={item.position}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.position * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          #{item.position}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.terminal} • Score: {item.priority_score}
                            {item.smart7_score && ` • Smart7: ${item.smart7_score}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.is_featured && (
                          <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                            ⭐ Featured
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {item.vibe_tags?.split(',').slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800">Test Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Test History */}
        {testHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📚</span>
              Recent Test History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testHistory.map((result, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="font-medium text-gray-900 mb-2">{result.collection}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Selected: {result.smart7_selected}/{result.total_available}</div>
                    <div>Terminals: {result.diversity_check.terminals}</div>
                    <div>Featured: {result.diversity_check.featured_count}</div>
                    <div>Load Time: {result.performance.load_time}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

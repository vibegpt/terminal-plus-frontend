// vibeStorageUsage.ts
// Comprehensive usage examples for VibeStorageManager

import { getStorageManager, CollectionData, AmenityData } from '../utils/vibeStorageManager';

// Initialize storage manager
const storage = getStorageManager({
  maxCacheAge: 7200000,        // 2 hours
  maxCacheSize: 20 * 1024 * 1024, // 20MB
  enableCompression: true,
  enableOfflineSupport: true
});

// Example 1: Store and retrieve collections
export const collectionStorageExample = async () => {
  console.log('🔄 Collection Storage Example');
  
  // Sample collection data
  const collectionData: CollectionData = {
    slug: 'jewel-discovery',
    vibe: 'discover',
    name: 'Jewel Discovery',
    description: 'Explore the hidden gems of Jewel Changi Airport',
    imageUrl: 'https://example.com/jewel-discovery.jpg',
    amenityIds: [101, 102, 103, 104, 105],
    terminals: ['SIN-JEWEL', 'SIN-T1', 'SIN-T2', 'SIN-T3'],
    featured: true,
    order: 1,
    metadata: {
      category: 'attractions',
      difficulty: 'easy',
      estimatedTime: '2-3 hours'
    }
  };

  try {
    // Store collection
    const stored = await storage.storeCollection(collectionData);
    console.log('✅ Collection stored:', stored);
    
    // Retrieve collection
    const retrieved = await storage.getCollection('discover', 'jewel-discovery');
    console.log('📖 Retrieved collection:', retrieved?.name);
    
    // Get all collections for discover vibe
    const discoverCollections = await storage.getCollectionsByVibe('discover');
    console.log('🔍 Discover collections:', discoverCollections.length);
    
  } catch (error) {
    console.error('❌ Collection storage failed:', error);
  }
};

// Example 2: Store and filter amenities
export const amenityStorageExample = async () => {
  console.log('🔄 Amenity Storage Example');
  
  // Sample amenity data
  const amenities: AmenityData[] = [
    {
      id: 101,
      created_at: new Date().toISOString(),
      amenity_slug: 'rain-vortex',
      description: 'World\'s tallest indoor waterfall',
      website_url: 'https://example.com/rain-vortex',
      logo_url: 'https://example.com/rain-vortex-logo.png',
      vibe_tags: 'discover,attraction,waterfall,instagram',
      booking_required: false,
      available_in_tr: true,
      price_level: 'Free',
      opening_hours: '24/7',
      terminal_code: 'SIN-JEWEL',
      airport_code: 'SIN',
      name: 'Rain Vortex'
    },
    {
      id: 102,
      created_at: new Date().toISOString(),
      amenity_slug: 'canopy-park',
      description: 'Adventure playground and walking trails',
      website_url: 'https://example.com/canopy-park',
      logo_url: 'https://example.com/canopy-park-logo.png',
      vibe_tags: 'discover,outdoor,adventure,family',
      booking_required: false,
      available_in_tr: true,
      price_level: '$$',
      opening_hours: '6:00 AM - 12:00 AM',
      terminal_code: 'SIN-JEWEL',
      airport_code: 'SIN',
      name: 'Canopy Park'
    },
    {
      id: 103,
      created_at: new Date().toISOString(),
      amenity_slug: 'shiseido-forest-valley',
      description: 'Tranquil garden with walking paths',
      website_url: 'https://example.com/forest-valley',
      logo_url: 'https://example.com/forest-valley-logo.png',
      vibe_tags: 'chill,nature,garden,peaceful',
      booking_required: false,
      available_in_tr: true,
      price_level: 'Free',
      opening_hours: '24/7',
      terminal_code: 'SIN-JEWEL',
      airport_code: 'SIN',
      name: 'Shiseido Forest Valley'
    }
  ];

  try {
    // Store amenities for Jewel terminal
    const stored = await storage.storeAmenities(amenities, 'SIN-JEWEL');
    console.log('✅ Amenities stored:', stored);
    
    // Get all amenities for Jewel terminal
    const jewelAmenities = await storage.getAmenities({ terminal: 'SIN-JEWEL' });
    console.log('📖 Jewel amenities:', jewelAmenities.length);
    
    // Filter amenities by vibe
    const discoverAmenities = await storage.getAmenities({ 
      vibe: 'discover', 
      terminal: 'SIN-JEWEL' 
    });
    console.log('🔍 Discover amenities in Jewel:', discoverAmenities.length);
    
    // Filter amenities by collection
    const collectionAmenities = await storage.getAmenities({ 
      vibe: 'discover', 
      collection: 'jewel-discovery',
      terminal: 'SIN-JEWEL' 
    });
    console.log('📚 Collection amenities:', collectionAmenities.length);
    
  } catch (error) {
    console.error('❌ Amenity storage failed:', error);
  }
};

// Example 3: Batch operations and cache management
export const batchOperationsExample = async () => {
  console.log('🔄 Batch Operations Example');
  
  // Multiple collections for different vibes
  const collections: CollectionData[] = [
    {
      slug: 'quick-bites',
      vibe: 'quick',
      name: 'Quick Bites',
      description: 'Fast food and grab-and-go options',
      amenityIds: [201, 202, 203],
      featured: false,
      order: 1
    },
    {
      slug: 'business-lounges',
      vibe: 'work',
      name: 'Business Lounges',
      description: 'Professional workspaces and meeting rooms',
      amenityIds: [301, 302, 303],
      featured: true,
      order: 1
    },
    {
      slug: 'retail-therapy',
      vibe: 'shop',
      name: 'Retail Therapy',
      description: 'Shopping and retail experiences',
      amenityIds: [401, 402, 403],
      featured: true,
      order: 1
    }
  ];

  try {
    // Batch store collections
    const successCount = await storage.batchStoreCollections(collections);
    console.log('✅ Batch stored collections:', successCount);
    
    // Get collections by different vibes
    const quickCollections = await storage.getCollectionsByVibe('quick');
    const workCollections = await storage.getCollectionsByVibe('work');
    const shopCollections = await storage.getCollectionsByVibe('shop');
    
    console.log('⚡ Quick collections:', quickCollections.length);
    console.log('💼 Work collections:', workCollections.length);
    console.log('🛍️ Shop collections:', shopCollections.length);
    
  } catch (error) {
    console.error('❌ Batch operations failed:', error);
  }
};

// Example 4: Cache management and statistics
export const cacheManagementExample = async () => {
  console.log('🔄 Cache Management Example');
  
  try {
    // Get storage statistics
    const stats = storage.getStats();
    console.log('📊 Storage Statistics:');
    console.log('  - Total size:', (stats.totalSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('  - Item count:', stats.itemCount);
    console.log('  - Cache hit rate:', (stats.cacheHitRate * 100).toFixed(1) + '%');
    console.log('  - Oldest item:', stats.oldestItem?.toLocaleString());
    console.log('  - Newest item:', stats.newestItem?.toLocaleString());
    
    // Vibe distribution
    console.log('🎭 Vibe Distribution:');
    Object.entries(stats.vibeDistribution).forEach(([vibe, count]) => {
      console.log(`  - ${vibe}: ${count} items`);
    });
    
    // Terminal distribution
    console.log('🏢 Terminal Distribution:');
    Object.entries(stats.terminalDistribution).forEach(([terminal, count]) => {
      console.log(`  - ${terminal}: ${count} items`);
    });
    
    // Clear specific cache
    await storage.clearCache({ vibe: 'discover' });
    console.log('🧹 Cleared discover vibe cache');
    
    // Clear terminal cache
    await storage.clearCache({ terminal: 'SIN-JEWEL' });
    console.log('🧹 Cleared Jewel terminal cache');
    
    // Get updated stats
    const updatedStats = storage.getStats();
    console.log('📊 Updated item count:', updatedStats.itemCount);
    
  } catch (error) {
    console.error('❌ Cache management failed:', error);
  }
};

// Example 5: Offline operations
export const offlineOperationsExample = async () => {
  console.log('🔄 Offline Operations Example');
  
  try {
    // Queue operations for offline processing
    await storage.queueOfflineOperation({
      type: 'store_collection',
      data: {
        slug: 'offline-collection',
        vibe: 'discover',
        name: 'Offline Collection',
        description: 'Created while offline',
        amenityIds: [999],
        featured: false,
        order: 999
      },
      timestamp: Date.now()
    });
    
    await storage.queueOfflineOperation({
      type: 'store_amenities',
      data: {
        terminal: 'SIN-T4',
        amenities: [{
          id: 999,
          created_at: new Date().toISOString(),
          amenity_slug: 'offline-amenity',
          description: 'Created while offline',
          vibe_tags: 'offline,test',
          booking_required: false,
          available_in_tr: true,
          price_level: 'Free',
          opening_hours: '24/7',
          terminal_code: 'SIN-T4',
          airport_code: 'SIN',
          name: 'Offline Amenity'
        }]
      },
      timestamp: Date.now()
    });
    
    console.log('📱 Queued offline operations');
    
    // Process offline queue (simulate connection restored)
    await storage.processOfflineQueue();
    console.log('🔄 Processed offline queue');
    
  } catch (error) {
    console.error('❌ Offline operations failed:', error);
  }
};

// Example 6: Advanced filtering and queries
export const advancedQueriesExample = async () => {
  console.log('🔄 Advanced Queries Example');
  
  try {
    // Get amenities with various filter combinations
    const allAmenities = await storage.getAmenities({ useCache: false });
    console.log('🌐 All amenities:', allAmenities.length);
    
    // Filter by vibe tags
    const instagramAmenities = await storage.getAmenities({ 
      vibe: 'instagram',
      useCache: true 
    });
    console.log('📸 Instagram-worthy amenities:', instagramAmenities.length);
    
    // Filter by terminal and vibe
    const terminalDiscoverAmenities = await storage.getAmenities({ 
      terminal: 'SIN-T3',
      vibe: 'discover',
      useCache: true 
    });
    console.log('🔍 Discover amenities in T3:', terminalDiscoverAmenities.length);
    
    // Get collections with specific metadata
    const featuredCollections = await storage.getCollectionsByVibe('discover');
    const featured = featuredCollections.filter(c => c.featured);
    console.log('⭐ Featured discover collections:', featured.length);
    
  } catch (error) {
    console.error('❌ Advanced queries failed:', error);
  }
};

// Main function to run all examples
export const runAllExamples = async () => {
  console.log('🚀 Starting VibeStorageManager Examples...\n');
  
  try {
    await collectionStorageExample();
    console.log('');
    
    await amenityStorageExample();
    console.log('');
    
    await batchOperationsExample();
    console.log('');
    
    await cacheManagementExample();
    console.log('');
    
    await offlineOperationsExample();
    console.log('');
    
    await advancedQueriesExample();
    console.log('');
    
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
};

// Export individual examples for selective testing
export {
  collectionStorageExample,
  amenityStorageExample,
  batchOperationsExample,
  cacheManagementExample,
  offlineOperationsExample,
  advancedQueriesExample
};

// Usage patterns for quick reference
export const usagePatterns = {
  // Basic collection operations
  storeCollection: `await storage.storeCollection(collectionData)`,
  getCollection: `await storage.getCollection('discover', 'jewel-discovery')`,
  getCollectionsByVibe: `await storage.getCollectionsByVibe('discover')`,
  
  // Basic amenity operations
  storeAmenities: `await storage.storeAmenities(amenities, 'SIN-T3')`,
  getAmenities: `await storage.getAmenities({ vibe: 'discover', terminal: 'SIN-T3' })`,
  
  // Cache management
  getStats: `const stats = storage.getStats()`,
  clearCache: `await storage.clearCache({ vibe: 'discover' })`,
  clearAllCache: `await storage.clearCache({ all: true })`,
  
  // Offline operations
  queueOperation: `await storage.queueOfflineOperation(operation)`,
  processQueue: `await storage.processOfflineQueue()`,
  
  // Batch operations
  batchStore: `await storage.batchStoreCollections(collections)`
};

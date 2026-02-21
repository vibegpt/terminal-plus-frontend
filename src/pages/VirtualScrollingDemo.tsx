import React, { useState, useMemo } from 'react';
import { VirtualAmenityList, DynamicVirtualAmenityList } from '../components/VirtualAmenityList';
import { VirtualCollectionList } from '../components/VirtualCollectionList';
import { useVirtualScrollPerformance } from '../hooks/useVirtualScroll';
import { Button } from '../components/ui/button';

// Generate mock data for demonstration
const generateMockAmenities = (count: number) => {
  const amenities = [];
  const names = ['Starbucks', 'McDonald\'s', 'Burger King', 'KFC', 'Subway', 'Pizza Hut', 'Domino\'s', 'Coffee Bean', 'Toast Box', 'Ya Kun'];
  const terminals = ['T1', 'T2', 'T3', 'T4', 'JEWEL'];
  const priceLevels = ['$', '$$', '$$$'] as const;
  const vibeTags = ['coffee', 'fast-food', 'quick', 'comfort', 'healthy', 'dessert', 'breakfast', 'lunch', 'dinner'];

  for (let i = 1; i <= count; i++) {
    amenities.push({
      id: i,
      name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
      description: `Delicious food and beverages available ${i % 2 === 0 ? 'with great service and atmosphere' : 'for quick meals on the go'}`,
      terminal_code: terminals[i % terminals.length],
      price_level: priceLevels[i % priceLevels.length],
      vibe_tags: vibeTags.slice(0, Math.floor(Math.random() * 4) + 1),
      opening_hours: i % 3 === 0 ? '24/7' : '06:00-23:00',
      logo_url: `https://picsum.photos/60/60?random=${i}`
    });
  }

  return amenities;
};

const generateMockCollections = (count: number) => {
  const collections = [];
  const vibes = ['comfort', 'refuel', 'quick', 'chill', 'work', 'discover', 'shop'];
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'];
  const icons = ['☕', '🍔', '⚡', '🧘', '💼', '🔍', '🛍️'];

  for (let i = 1; i <= count; i++) {
    const vibe = vibes[i % vibes.length];
    collections.push({
      id: i,
      name: `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Collection`,
      description: `Curated amenities for your ${vibe} needs`,
      vibe,
      icon: icons[i % icons.length],
      color: colors[i % colors.length],
      amenityCount: Math.floor(Math.random() * 50) + 10,
      amenities: []
    });
  }

  return collections;
};

export const VirtualScrollingDemo: React.FC = () => {
  const [amenityCount, setAmenityCount] = useState(1000);
  const [collectionCount, setCollectionCount] = useState(100);
  const [selectedDemo, setSelectedDemo] = useState<'amenities' | 'collections'>('amenities');

  const mockAmenities = useMemo(() => generateMockAmenities(amenityCount), [amenityCount]);
  const mockCollections = useMemo(() => generateMockCollections(collectionCount), [collectionCount]);

  const { metrics, measureRenderTime } = useVirtualScrollPerformance();

  const handleRenderStart = () => {
    const startTime = performance.now();
    measureRenderTime(startTime);
  };

  const handleCollectionClick = (collection: any) => {
    console.log('Collection clicked:', collection);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Virtual Scrolling Demo</h1>
      
      {/* Controls */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <Button
            onClick={() => setSelectedDemo('amenities')}
            variant={selectedDemo === 'amenities' ? 'default' : 'outline'}
          >
            Amenities List
          </Button>
          <Button
            onClick={() => setSelectedDemo('collections')}
            variant={selectedDemo === 'collections' ? 'default' : 'outline'}
          >
            Collections List
          </Button>
        </div>

        {selectedDemo === 'amenities' && (
          <div className="flex items-center gap-4">
            <label htmlFor="amenity-count">Amenities Count:</label>
            <input
              id="amenity-count"
              type="number"
              value={amenityCount}
              onChange={(e) => setAmenityCount(parseInt(e.target.value) || 1000)}
              min="100"
              max="10000"
              step="100"
              className="border rounded px-2 py-1"
            />
            <Button onClick={handleRenderStart} size="sm">
              Re-render
            </Button>
          </div>
        )}

        {selectedDemo === 'collections' && (
          <div className="flex items-center gap-4">
            <label htmlFor="collection-count">Collections Count:</label>
            <input
              id="collection-count"
              type="number"
              value={collectionCount}
              onChange={(e) => setCollectionCount(parseInt(e.target.value) || 100)}
              min="10"
              max="1000"
              step="10"
              className="border rounded px-2 py-1"
            />
            <Button onClick={handleRenderStart} size="sm">
              Re-render
            </Button>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Render Time:</span>
            <span className="ml-2">{metrics.renderTime.toFixed(2)}ms</span>
          </div>
          <div>
            <span className="font-medium">Scroll FPS:</span>
            <span className="ml-2">{metrics.scrollFPS}</span>
          </div>
          <div>
            <span className="font-medium">Memory:</span>
            <span className="ml-2">
              {metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Virtual Scrolling Demo */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          {selectedDemo === 'amenities' ? 'Amenities' : 'Collections'} Virtual List
          ({selectedDemo === 'amenities' ? amenityCount : collectionCount} items)
        </h3>
        
        {selectedDemo === 'amenities' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Fixed Height Virtual List</h4>
              <VirtualAmenityList
                amenities={mockAmenities}
                height={400}
                itemHeight={200}
                collectionId={1}
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Dynamic Height Virtual List</h4>
              <DynamicVirtualAmenityList
                amenities={mockAmenities}
                height={400}
                collectionId={1}
              />
            </div>
          </div>
        )}

        {selectedDemo === 'collections' && (
          <div>
            <h4 className="font-medium mb-2">Collections Virtual List</h4>
            <VirtualCollectionList
              collections={mockCollections}
              onCollectionClick={handleCollectionClick}
              height={500}
              itemHeight={180}
            />
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="mt-8 bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Virtual Scrolling Benefits</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Performance:</strong> Only renders visible items, dramatically reducing DOM nodes</li>
          <li><strong>Memory:</strong> Constant memory usage regardless of list size</li>
          <li><strong>Scroll Performance:</strong> Smooth scrolling even with thousands of items</li>
          <li><strong>Intersection Observer:</strong> Optimized visibility detection for lazy loading</li>
          <li><strong>Responsive:</strong> Works seamlessly on mobile and desktop</li>
        </ul>
      </div>
    </div>
  );
};

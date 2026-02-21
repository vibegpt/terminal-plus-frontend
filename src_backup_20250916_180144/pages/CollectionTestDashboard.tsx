// src/pages/CollectionTestDashboard.tsx
// Test dashboard to verify all collections are properly integrated

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  COLLECTION_MAPPINGS,
  getCollectionsForVibe,
  getTimeSlot,
  getVibesInOrder
} from '@/services/VibeCollectionsService';
import { Check, X, AlertCircle, Clock, Package } from 'lucide-react';

interface CollectionStatus {
  collection_id: string;
  name: string;
  vibe: string;
  exists_in_db: boolean;
  amenity_count: number;
  is_core: boolean;
  is_dynamic: boolean;
  currently_active: boolean;
  status: 'good' | 'warning' | 'error';
}

const CollectionTestDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [collectionStatuses, setCollectionStatuses] = useState<CollectionStatus[]>([]);
  const [dbStats, setDbStats] = useState<any>({});
  const [currentTimeSlot, setCurrentTimeSlot] = useState(getTimeSlot());
  const [vibeOrder, setVibeOrder] = useState<string[]>([]);

  useEffect(() => {
    testCollections();
    setVibeOrder(getVibesInOrder());
  }, []);

  const testCollections = async () => {
    setLoading(true);
    
    // 1. Get all collections from database
    const { data: dbCollections, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_amenities(count)
      `);

    if (error) {
      console.error('Error fetching collections:', error);
      setLoading(false);
      return;
    }

    // 2. Get database statistics
    const { data: stats } = await supabase
      .rpc('get_collection_stats');
    
    setDbStats({
      total_collections: dbCollections?.length || 0,
      collections_with_amenities: dbCollections?.filter(c => 
        c.collection_amenities?.[0]?.count > 0
      ).length || 0,
      total_amenities: dbCollections?.reduce((sum, c) => 
        sum + (c.collection_amenities?.[0]?.count || 0), 0
      ) || 0
    });

    // 3. Test each collection mapping
    const statuses: CollectionStatus[] = [];
    
    for (const mapping of COLLECTION_MAPPINGS) {
      const dbCollection = dbCollections?.find(
        c => c.collection_id === mapping.collection_slug
      );
      
      const amenityCount = dbCollection?.collection_amenities?.[0]?.count || 0;
      const vibeCollections = getCollectionsForVibe(mapping.vibe, currentTimeSlot);
      const isCurrentlyActive = vibeCollections.some(
        c => c.collection_slug === mapping.collection_slug
      );
      
      let status: 'good' | 'warning' | 'error' = 'good';
      if (!dbCollection) {
        status = 'error';
      } else if (amenityCount === 0) {
        status = 'error';
      } else if (amenityCount < 5) {
        status = 'warning';
      }
      
      statuses.push({
        collection_id: mapping.collection_slug,
        name: mapping.collection_name,
        vibe: mapping.vibe,
        exists_in_db: !!dbCollection,
        amenity_count: amenityCount,
        is_core: mapping.isCore || false,
        is_dynamic: mapping.isDynamic || false,
        currently_active: isCurrentlyActive,
        status
      });
    }
    
    setCollectionStatuses(statuses);
    setLoading(false);
  };

  // Group collections by vibe
  const collectionsByVibe = collectionStatuses.reduce((acc, col) => {
    if (!acc[col.vibe]) acc[col.vibe] = [];
    acc[col.vibe].push(col);
    return acc;
  }, {} as Record<string, CollectionStatus[]>);

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getVibeEmoji = (vibe: string) => {
    const emojis: Record<string, string> = {
      comfort: '👑',
      chill: '😌',
      refuel: '🍔',
      work: '💼',
      shop: '🛍️',
      quick: '⚡',
      explore: '🧭'
    };
    return emojis[vibe] || '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running collection tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Collection Integration Test Dashboard</h1>
          
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Total Collections</div>
              <div className="text-2xl font-bold">{dbStats.total_collections}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">With Amenities</div>
              <div className="text-2xl font-bold">{dbStats.collections_with_amenities}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 text-sm font-medium">Total Amenities</div>
              <div className="text-2xl font-bold">{dbStats.total_amenities}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-orange-600 text-sm font-medium">Current Time Slot</div>
              <div className="text-2xl font-bold">{currentTimeSlot}</div>
            </div>
          </div>

          {/* Current Vibe Order */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium mb-2">Current Vibe Order (Time-Based):</div>
            <div className="flex flex-wrap gap-2">
              {vibeOrder.map((vibe, index) => (
                <span key={vibe} className="flex items-center space-x-1 bg-white px-3 py-1 rounded-full text-sm">
                  <span className="text-gray-500">#{index + 1}</span>
                  <span>{getVibeEmoji(vibe)}</span>
                  <span className="font-medium capitalize">{vibe}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Collections by Vibe */}
        {vibeOrder.map(vibe => (
          <div key={vibe} className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <span className="text-2xl">{getVibeEmoji(vibe)}</span>
                <span className="capitalize">{vibe}</span>
                <span className="text-sm text-gray-500 font-normal ml-2">
                  ({collectionsByVibe[vibe]?.length || 0} collections)
                </span>
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Core</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Dynamic</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-green-500" />
                  <span>Active Now</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {collectionsByVibe[vibe]?.map(collection => (
                <div 
                  key={collection.collection_id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    collection.currently_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(collection.status)}
                    <div>
                      <div className="font-medium">{collection.name}</div>
                      <div className="text-sm text-gray-500">
                        <code className="text-xs bg-gray-100 px-1 rounded">{collection.collection_id}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Type badges */}
                    <div className="flex items-center space-x-2">
                      {collection.is_core && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Core
                        </span>
                      )}
                      {collection.is_dynamic && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                          Dynamic
                        </span>
                      )}
                      {collection.currently_active && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${
                          collection.amenity_count === 0 ? 'text-red-500' :
                          collection.amenity_count < 5 ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {collection.amenity_count} amenities
                        </span>
                      </div>
                      {!collection.exists_in_db && (
                        <div className="text-xs text-red-500">Not in DB</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-bold mb-4">Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-2">Status Breakdown</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Good</span>
                  </span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.status === 'good').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Warning</span>
                  </span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.status === 'warning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-red-500" />
                    <span>Error</span>
                  </span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.status === 'error').length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Collection Types</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Core Collections</span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.is_core).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dynamic Collections</span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.is_dynamic).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Currently Active</span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.currently_active).length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Coverage</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Collections in DB</span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.exists_in_db).length} / {collectionStatuses.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>With Amenities</span>
                  <span className="font-medium">
                    {collectionStatuses.filter(c => c.amenity_count > 0).length} / {collectionStatuses.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ready to Use</span>
                  <span className="font-medium text-green-600">
                    {collectionStatuses.filter(c => c.status === 'good').length} / {collectionStatuses.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionTestDashboard;

import React from 'react';
import { useUnifiedCollections } from '@/hooks/useUnifiedCollections';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { CollectionDebugPanel } from './CollectionDebugPanel';

interface BestOfCollectionsProps {
  airport: string;
  terminal: string;
  context?: 'departure' | 'arrival' | 'transit' | 'layover';
  maxResults?: number;
  featuredOnly?: boolean;
}

export function BestOfCollections({ 
  airport, 
  terminal, 
  context, 
  maxResults = 10,
  featuredOnly = false 
}: BestOfCollectionsProps) {
  // Temporary: Direct Supabase call for testing
  const [directCollections, setDirectCollections] = useState<any[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Test direct RPC call
  useEffect(() => {
    async function testDirectRPC() {
      setDirectLoading(true);
      try {
        console.log('🧪 Testing direct RPC call...');
        
        // Try the RPC function first
        const { data, error } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airport,
          p_terminal: terminal
        });
        
        if (error) {
          console.error('❌ RPC error:', error);
          setDirectError(error.message);
          
          // Fallback: try basic collections query
          const { data: basicData, error: basicError } = await supabase
            .from('collections')
            .select('*')
            .limit(5);
            
          if (basicData) {
            console.log('✅ Basic collections query worked:', basicData);
            setDirectCollections(basicData);
          } else {
            console.error('❌ Basic query also failed:', basicError);
          }
        } else {
          console.log('✅ RPC call successful:', data);
          setDirectCollections(data || []);
        }
      } catch (err) {
        console.error('❌ Direct call failed:', err);
        setDirectError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setDirectLoading(false);
      }
    }
    
    testDirectRPC();
  }, [airport, terminal]);

  // Original hook call
  const { collections, loading, error, stats } = useUnifiedCollections(airport, terminal);

  if (loading || directLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading collections...</span>
      </div>
    );
  }

  if (error || directError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error || directError}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Debug Info</summary>
          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
            {JSON.stringify({ error, directError, airport, terminal }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Show both results for comparison
  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <CollectionDebugPanel airport={airport} terminal={terminal} />
      
      {/* Debug Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Hook Results:</strong>
            <p>Collections: {collections.length}</p>
            <p>Total Spots: {stats.totalSpots}</p>
            <p>Near You: {stats.totalNearYou}</p>
          </div>
          <div>
            <strong>Direct RPC Results:</strong>
            <p>Collections: {directCollections.length}</p>
            <p>First Collection: {directCollections[0]?.name || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Best of {airport} {terminal}
        </h2>
        {context && (
          <p className="text-gray-600 mb-4">
            Optimized for {context} experience
          </p>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCollections}</div>
            <div className="text-sm text-gray-600">Collections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalSpots}</div>
            <div className="text-sm text-gray-600">Total Spots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalNearYou}</div>
            <div className="text-sm text-gray-600">Near You</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.coveragePercentage}%</div>
            <div className="text-sm text-gray-600">Coverage</div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(collection => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  );
}

interface CollectionCardProps {
  collection: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    gradient: string;
    description: string;
    featured: boolean;
    spots_in_terminal: number;
    spots_near_you: number;
    total_spots: number;
  };
}

function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <div className="collection-card p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {collection.icon} {collection.name}
      </h3>
      
      <p className="text-blue-600 font-medium mb-1">
        {collection.spots_in_terminal} spots in terminal
      </p>
      
      <p className="text-sm text-gray-500 mb-3">
        {collection.total_spots} total across all terminals
      </p>
      
      <p className="text-sm text-gray-600">
        {collection.spots_near_you} spots near you
      </p>
      
      {/* Optional: Featured indicator */}
      {collection.featured && (
        <div className="mt-3 pt-2 border-t">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
            Featured
          </span>
        </div>
      )}
    </div>
  );
}

export default BestOfCollections;

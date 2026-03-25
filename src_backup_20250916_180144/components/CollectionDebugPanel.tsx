// Test Component to Debug Collection Display
// Add this to your page to see if data is coming through

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CollectionDebugPanelProps {
  airport: string;
  terminal: string;
}

export function CollectionDebugPanel({ airport, terminal }: CollectionDebugPanelProps) {
  const [directRPCData, setDirectRPCData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function debugCollections() {
      setLoading(true);
      try {
        console.log('🔍 CollectionDebugPanel: Starting debug...');
        
        // Test 1: Direct RPC call
        console.log('🧪 Testing direct RPC call...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airport,
          p_terminal: terminal
        });
        
        if (rpcError) {
          console.error('❌ RPC error:', rpcError);
          setError(rpcError.message);
        } else {
          console.log('✅ RPC call successful:', rpcData);
          setDirectRPCData(rpcData || []);
        }

        // Test 2: Service call (if available)
        try {
          console.log('🧪 Testing TerminalCollectionService...');
          const { getCollectionsWithCounts } = await import('@/services/TerminalCollectionService');
          const serviceResult = await getCollectionsWithCounts(airport, terminal);
          console.log('✅ Service call successful:', serviceResult);
          setServiceData(serviceResult || []);
        } catch (serviceError) {
          console.error('❌ Service call failed:', serviceError);
        }

        // Test 3: Check basic tables
        console.log('🧪 Checking basic tables...');
        const { data: collectionsData } = await supabase.from('collections').select('*').limit(3);
        console.log('Collections table:', collectionsData);

        const { data: amenitiesData } = await supabase.from('amenity_detail')
          .select('*')
          .eq('airport_code', airport)
          .eq('terminal_code', `${airport}-${terminal}`)
          .limit(3);
        console.log('Amenities table:', amenitiesData);

      } catch (err) {
        console.error('❌ Debug failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    debugCollections();
  }, [airport, terminal]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">Debugging collections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">❌ Debug Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const firstCollection = directRPCData[0];
  const firstServiceCollection = serviceData[0];

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-yellow-800 mb-4">🔍 Collection Debug Panel</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct RPC Results */}
        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Direct RPC Results</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Collections Found:</strong> {directRPCData.length}</p>
            {firstCollection && (
              <>
                <p><strong>First Collection:</strong> {firstCollection.collection_name}</p>
                <p><strong>spots_near_you:</strong> {firstCollection.spots_near_you}</p>
                <p><strong>spots_total:</strong> {firstCollection.spots_total}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">Full Data</summary>
                  <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                    {JSON.stringify(firstCollection, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        </div>

        {/* Service Results */}
        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Service Results</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Collections Found:</strong> {serviceData.length}</p>
            {firstServiceCollection && (
              <>
                <p><strong>First Collection:</strong> {firstServiceCollection.name}</p>
                <p><strong>spots_in_terminal:</strong> {firstServiceCollection.spots_in_terminal}</p>
                <p><strong>total_spots:</strong> {firstServiceCollection.total_spots}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">Full Data</summary>
                  <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                    {JSON.stringify(firstServiceCollection, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">Summary</h4>
        <div className="text-sm space-y-1">
          <p><strong>RPC Function:</strong> {directRPCData.length > 0 ? '✅ Working' : '❌ Failed'}</p>
          <p><strong>Service Function:</strong> {serviceData.length > 0 ? '✅ Working' : '❌ Failed'}</p>
          <p><strong>Data Consistency:</strong> {
            directRPCData.length > 0 && serviceData.length > 0 
              ? '✅ Both returning data' 
              : '❌ Mismatch detected'
          }</p>
        </div>
      </div>
    </div>
  );
}

// Collection Card that ACTUALLY uses the RPC data
export function WorkingCollectionCard({ collection }: { collection: any }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-2xl">{collection.icon}</span>
          {collection.collection_name || collection.name}
        </h3>
        {collection.featured && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">LIVE</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {collection.spots_total} spots near you • {collection.spots_near_you} total
        </span>
        <span className="text-blue-600">
          {collection.spots_near_you} in Terminal {collection.terminal || 'T3'}
        </span>
      </div>
    </div>
  );
}

// Complete Working Collections Display
export function WorkingCollectionsDisplay({ airport = 'SIN', terminal = 'T3' }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.rpc('get_collections_for_terminal', {
        p_airport_code: airport,
        p_terminal: terminal
      });
      setCollections(data || []);
      setLoading(false);
    }
    fetchData();
  }, [airport, terminal]);
  
  if (loading) return <div>Loading collections...</div>;
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Smart Collections</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <WorkingCollectionCard key={col.collection_uuid} collection={col} />
        ))}
      </div>
    </div>
  );
}
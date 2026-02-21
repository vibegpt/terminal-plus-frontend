// Test page to verify RPC functions are working
// Save as: src/pages/test-rpc-functions.tsx

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestRPCFunctions() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testFunction1 = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_collections_for_terminal', {
        p_airport_code: 'SYD',
        p_terminal: 'T1'
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        test1: { success: true, count: data?.length || 0, data }
      }));
    } catch (err: any) {
      setError(`Test 1 failed: ${err.message}`);
      setResults(prev => ({
        ...prev,
        test1: { success: false, error: err.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testFunction2 = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_collections_for_terminal', {
        p_airport_code: 'SIN',
        p_terminal: 'T3'
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        test2: { success: true, count: data?.length || 0, data }
      }));
    } catch (err: any) {
      setError(`Test 2 failed: ${err.message}`);
      setResults(prev => ({
        ...prev,
        test2: { success: false, error: err.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testFunction3 = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test with different format
      const { data, error } = await supabase.rpc('get_collections_for_terminal', {
        p_airport_code: 'SYD',
        p_terminal: 'Terminal 1'  // Testing format variation
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        test3: { success: true, count: data?.length || 0, data }
      }));
    } catch (err: any) {
      setError(`Test 3 failed: ${err.message}`);
      setResults(prev => ({
        ...prev,
        test3: { success: false, error: err.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAmenities = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_collection_amenities', {
        p_collection_slug: 'true-blue-aussie',
        p_airport_code: 'SYD',
        p_terminal: 'T1'
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        amenities: { success: true, count: data?.length || 0, data }
      }));
    } catch (err: any) {
      setError(`Amenities test failed: ${err.message}`);
      setResults(prev => ({
        ...prev,
        amenities: { success: false, error: err.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    await testFunction1();
    await testFunction2();
    await testFunction3();
    await testAmenities();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">RPC Function Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run All Tests'}
        </button>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testFunction1}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Test SYD T1
          </button>
          <button
            onClick={testFunction2}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Test SIN T3
          </button>
          <button
            onClick={testFunction3}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Test Format Variation
          </button>
          <button
            onClick={testAmenities}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Test Amenities
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(results).map(([key, value]: [string, any]) => (
          <div key={key} className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">
              {key}: {value.success ? '✅ Success' : '❌ Failed'}
            </h3>
            {value.success ? (
              <div>
                <p className="text-sm text-gray-600">Found {value.count} results</p>
                {value.data && value.data.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold">Sample:</p>
                    <pre className="text-xs overflow-auto bg-white p-2 rounded mt-1">
                      {JSON.stringify(value.data[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600">{value.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Expected Results:</h3>
        <ul className="text-sm space-y-1">
          <li>✓ SYD T1 should return ~9 collections</li>
          <li>✓ SIN T3 should return collections with spots_total and spots_near_you</li>
          <li>✓ Format variation should work (Terminal 1 = T1)</li>
          <li>✓ Amenities should return actual amenity data</li>
        </ul>
      </div>
    </div>
  );
}
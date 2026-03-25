import React, { useState } from 'react';
import { Bug, Database, Users, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TerminalPlusDebug = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setTestResults(prev => ({ ...prev, [testName]: { status: 'running' } }));

    try {
      const result = await testFunction();
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { status: 'success', data: result } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { status: 'error', error: error.message } 
      }));
    }
    setLoading(false);
  };

  const tests = [
    {
      name: 'supabase_connection',
      label: 'Supabase Connection',
      description: 'Test basic Supabase client connection',
      function: async () => {
        const { terminalHubSocial } = await import('../lib/terminalhub-social');
        return await terminalHubSocial.testConnection();
      }
    },
    {
      name: 'activity_feed',
      label: 'Activity Feed Query', 
      description: 'Test the social activity feed query',
      function: async () => {
        const { terminalHubSocial } = await import('../lib/terminalhub-social');
        const activities = await terminalHubSocial.getActivityFeed(5);
        return { count: activities.length, sample: activities[0] };
      }
    },
    {
      name: 'table_structure',
      label: 'Database Tables',
      description: 'Check if all required tables exist',
      function: async () => {
        const { supabase } = await import('../lib/supabase');
        
        const tables = [
          'user_profiles',
          'social_activities', 
          'user_social_stats',
          'achievements'
        ];
        
        const results = {};
        for (const table of tables) {
          try {
            const { error } = await supabase
              .from(table)
              .select('count(*)', { count: 'exact', head: true });
            results[table] = error ? `Error: ${error.message}` : 'Exists';
          } catch (err) {
            results[table] = `Failed: ${err.message}`;
          }
        }
        return results;
      }
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <Bug className="mr-3 h-8 w-8" />
            Terminal Plus Debug Console
          </h1>
          <p className="text-gray-600">
            Diagnose and test your social proof backend integration
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Quick Tests
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tests.map((test) => (
              <button
                key={test.name}
                onClick={() => runTest(test.name, test.function)}
                disabled={loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{test.label}</h3>
                  {getStatusIcon(testResults[test.name]?.status)}
                </div>
                <p className="text-sm text-gray-600">{test.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  {getStatusIcon(result.status)}
                  <span className="ml-2">
                    {tests.find(t => t.name === testName)?.label}
                  </span>
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.status}
                </span>
              </div>

              {result.status === 'success' && result.data && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-medium text-green-800 mb-2">Success Details:</h4>
                  <pre className="text-sm text-green-700 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              {result.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                  <p className="text-sm text-red-700 font-mono">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Console Logs */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Console Output
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            Check your browser's developer console for detailed logs from the tests above.
          </p>
          <p className="text-xs text-gray-500">
            Look for messages starting with 🔍, ✅, ❌, or 📝 from Terminal Plus
          </p>
        </div>

        {/* Environment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-800 mb-2">🔧 Environment Check:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Make sure your .env.local has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
            <li>• Verify all 5 database setup steps completed successfully</li>
            <li>• Check Supabase Dashboard → Table Editor to see if tables exist</li>
            <li>• Confirm RLS policies are properly configured</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TerminalPlusDebug; 
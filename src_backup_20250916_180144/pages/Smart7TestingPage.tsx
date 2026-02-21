import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestSmart7Collections } from '../components/TestSmart7Collections';
import { SingaporeVibeCollection } from '../components/SingaporeVibeCollection';
import { Smart7Badge } from '../components/Smart7Badge';

interface TestCollection {
  slug: string;
  name: string;
  description: string;
  terminal: string;
}

const TEST_COLLECTIONS: TestCollection[] = [
  {
    slug: 'lounges-affordable',
    name: 'Affordable Lounges',
    description: 'Budget-friendly lounge options for comfort',
    terminal: 'T1'
  },
  {
    slug: 'coffee-worth-walk',
    name: 'Coffee Worth Walking For',
    description: 'Quality coffee and cafes worth the journey',
    terminal: 'T2'
  },
  {
    slug: 'work-spots-real-wifi',
    name: 'Work Spots with Real WiFi',
    description: 'Productive spaces for business travelers',
    terminal: 'T3'
  },
  {
    slug: 'quick-bites',
    name: 'Quick Bites',
    description: 'Fast food options for time-pressed travelers',
    terminal: 'T4'
  },
  {
    slug: 'singapore-exclusives',
    name: 'Singapore Exclusives',
    description: 'Unique Singapore brands and experiences',
    terminal: 'T1'
  }
];

export const Smart7TestingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'testing' | 'collections' | 'performance'>('testing');
  const [selectedCollection, setSelectedCollection] = useState<TestCollection | null>(null);
  const [userContext, setUserContext] = useState({
    timeOfDay: new Date().getHours().toString(),
    pricePreference: 'any' as const,
    vibePreferences: [] as string[]
  });

  const tabs = [
    { id: 'testing', label: '🧪 Testing Suite', icon: '🧪' },
    { id: 'collections', label: '📚 Collections', icon: '📚' },
    { id: 'performance', label: '⚡ Performance', icon: '⚡' }
  ];

  const handleCollectionSelect = (collection: TestCollection) => {
    setSelectedCollection(collection);
    setActiveTab('collections');
  };

  const updateUserContext = (key: string, value: any) => {
    setUserContext(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Smart7Badge size="lg" variant="premium" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart7 Testing & Development</h1>
                <p className="text-sm text-gray-600">Test, validate, and optimize Smart7 collections</p>
              </div>
            </div>
            
            {/* User Context Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Time:</span>
                <select
                  value={userContext.timeOfDay}
                  onChange={(e) => updateUserContext('timeOfDay', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                >
                  <option value="6">6 AM</option>
                  <option value="9">9 AM</option>
                  <option value="12">12 PM</option>
                  <option value="15">3 PM</option>
                  <option value="18">6 PM</option>
                  <option value="21">9 PM</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Price:</span>
                <select
                  value={userContext.pricePreference}
                  onChange={(e) => updateUserContext('pricePreference', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                >
                  <option value="any">Any</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Testing Suite Tab */}
          {activeTab === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Smart7 Testing Suite</h2>
                <p className="text-gray-600 mb-6">
                  Comprehensive testing interface for validating Smart7 selections, performance metrics, and collection quality.
                </p>
                
                {/* Quick Collection Tests */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {TEST_COLLECTIONS.map((collection) => (
                    <motion.div
                      key={collection.slug}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200"
                      onClick={() => handleCollectionSelect(collection)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {collection.terminal.replace('T', '')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                          <p className="text-sm text-gray-600">{collection.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <TestSmart7Collections />
            </motion.div>
          )}

          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Collection Testing</h2>
                    <p className="text-gray-600">
                      Test individual collections with Smart7 selection algorithms and user context.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ← Back to Testing
                  </button>
                </div>
              </div>

              {selectedCollection ? (
                <div className="space-y-6">
                  {/* Collection Info */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                        {selectedCollection.terminal.replace('T', '')}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedCollection.name}</h3>
                        <p className="text-gray-600">{selectedCollection.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Testing with context: {userContext.timeOfDay}:00, Price: {userContext.pricePreference}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Collection Component */}
                  <SingaporeVibeCollection
                    collectionSlug={selectedCollection.slug}
                    terminal={selectedCollection.terminal}
                    userContext={userContext}
                    showPerformance={true}
                    enableAnimations={true}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Collection to Test</h3>
                  <p className="text-gray-500">
                    Choose a collection from the testing suite above to see it in action.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ Performance Monitoring</h2>
                <p className="text-gray-600 mb-6">
                  Monitor Smart7 algorithm performance, caching effectiveness, and optimization metrics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Performance Metrics */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Algorithm Performance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Load Time:</span>
                      <span className="font-medium">~150ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cache Hit Rate:</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selection Quality:</span>
                      <span className="font-medium">92%</span>
                    </div>
                  </div>
                </div>

                {/* Optimization Status */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🚀</span>
                    Optimization Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Caching:</span>
                      <span className="text-green-600">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lazy Loading:</span>
                      <span className="text-green-600">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Diversity Rules:</span>
                      <span className="text-green-600">✓ Active</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">💚</span>
                    System Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database:</span>
                      <span className="text-green-600">✓ Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">API:</span>
                      <span className="text-green-600">✓ Responsive</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Memory:</span>
                      <span className="text-yellow-600">⚠️ 75%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Charts Placeholder */}
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Performance charts and analytics would be displayed here</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Smart7Badge size="md" variant="premium" />
              <span className="text-lg font-semibold">Smart7 Testing Environment</span>
            </div>
            <p className="text-gray-400 text-sm">
              Development and testing tools for the Smart7 recommendation system
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

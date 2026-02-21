import React, { useState } from 'react';
import { ShoppingTrailDashboard } from '../components/ShoppingTrailDashboard';
import { smartQueue, ActionType, Priority } from '../services/smartQueue';
import { locationManager } from '../services/locationManager';
import { aiTrailGenerator, UserPreferences } from '../services/aiTrailGenerator';
import { cn } from '../lib/utils';

export default function ShoppingTrailDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [demoActions, setDemoActions] = useState<any[]>([]);
  const [generatedTrail, setGeneratedTrail] = useState<any>(null);

  const handleDemoAction = (actionType: ActionType, payload: any) => {
    const actionId = smartQueue.enqueue({
      type: actionType,
      priority: Priority.MEDIUM,
      payload,
      maxRetries: 3,
      metadata: {
        userId: 'demo-user',
        networkType: '4g',
        batteryLevel: 0.8
      }
    });

    setDemoActions(prev => [...prev, { id: actionId, type: actionType, payload, timestamp: Date.now() }]);
  };

  const handleGenerateDemoTrail = async () => {
    try {
      const preferences: UserPreferences = {
        userId: 'demo-user',
        interests: ['Luxury', 'Fashion', 'Electronics'],
        budget: { min: 100, max: 1000, currency: 'SGD' },
        duration: 4,
        pace: 'leisurely',
        accessibility: 'standard',
        groupSize: 2,
        weatherPreference: 'indoor',
        timeOfDay: 'afternoon'
      };

      const trail = await aiTrailGenerator.generateAITrail(preferences, {
        avoidCrowds: true,
        minimizeWalking: true,
        maximizeVariety: true,
        preferIndoor: true,
        budgetOptimized: true
      });

      setGeneratedTrail(trail);
    } catch (error) {
      console.error('Failed to generate demo trail:', error);
    }
  };

  const clearDemoActions = () => {
    setDemoActions([]);
    smartQueue.stopProcessing();
    setTimeout(() => {
      // Restart processing
      smartQueue.getStats();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Shopping Trail System Demo
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={clearDemoActions}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Demo Data
              </button>
              <a
                href="/shopping-trail"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Live Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'demo', label: 'Interactive Demo' },
              { id: 'trail', label: 'Generated Trail' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <ShoppingTrailDashboard />
        )}

        {activeTab === 'demo' && (
          <div className="space-y-8">
            {/* Demo Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Interactive Demo Controls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => handleDemoAction(ActionType.CHECK_IN, {
                    amenityId: 'demo-amenity-1',
                    name: 'Luxury Boutique',
                    location: { lat: 1.3644, lng: 103.9915 }
                  })}
                  className="p-4 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors text-left"
                >
                  <div className="font-medium text-green-800">Check In</div>
                  <div className="text-sm text-green-600">Simulate amenity check-in</div>
                </button>

                <button
                  onClick={() => handleDemoAction(ActionType.RATING_SUBMISSION, {
                    amenityId: 'demo-amenity-2',
                    rating: 5,
                    comment: 'Excellent service!'
                  })}
                  className="p-4 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors text-left"
                >
                  <div className="font-medium text-blue-800">Rate Experience</div>
                  <div className="text-sm text-blue-600">Submit 5-star rating</div>
                </button>

                <button
                  onClick={() => handleDemoAction(ActionType.PURCHASE_RECORDING, {
                    amenityId: 'demo-amenity-3',
                    amount: 250,
                    items: ['Designer Bag', 'Accessories']
                  })}
                  className="p-4 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition-colors text-left"
                >
                  <div className="font-medium text-purple-800">Record Purchase</div>
                  <div className="text-sm text-purple-600">Log $250 purchase</div>
                </button>

                <button
                  onClick={() => handleDemoAction(ActionType.ACHIEVEMENT, {
                    achievementId: 'first-purchase',
                    name: 'First Purchase',
                    description: 'Completed your first shopping trail purchase'
                  })}
                  className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors text-left"
                >
                  <div className="font-medium text-yellow-800">Unlock Achievement</div>
                  <div className="text-sm text-yellow-600">Simulate achievement unlock</div>
                </button>

                <button
                  onClick={() => handleDemoAction(ActionType.SOCIAL, {
                    type: 'share',
                    content: 'Just discovered amazing shops at Changi!',
                    platform: 'instagram'
                  })}
                  className="p-4 bg-pink-100 border border-pink-300 rounded-lg hover:bg-pink-200 transition-colors text-left"
                >
                  <div className="font-medium text-pink-800">Social Share</div>
                  <div className="text-sm text-pink-600">Simulate social media share</div>
                </button>

                <button
                  onClick={() => handleDemoAction(ActionType.ANALYTICS, {
                    event: 'demo_interaction',
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                  })}
                  className="p-4 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                  <div className="font-medium text-gray-800">Analytics Event</div>
                  <div className="text-sm text-gray-600">Track demo interaction</div>
                </button>
              </div>
            </div>

            {/* Demo Actions Log */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Demo Actions Log
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {demoActions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No demo actions yet. Use the controls above to simulate actions.
                  </p>
                ) : (
                  demoActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          action.type === ActionType.CHECK_IN ? 'bg-green-500' :
                          action.type === ActionType.RATING_SUBMISSION ? 'bg-blue-500' :
                          action.type === ActionType.PURCHASE_RECORDING ? 'bg-purple-500' :
                          action.type === ActionType.ACHIEVEMENT ? 'bg-yellow-500' :
                          action.type === ActionType.SOCIAL ? 'bg-pink-500' : 'bg-gray-500'
                        )} />
                        <span className="font-medium text-gray-900">
                          {action.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Queue Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Smart Queue Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {smartQueue.getStatus().queueLength}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {smartQueue.getStatus().completedCount}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {smartQueue.getStatus().failedCount}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {smartQueue.getStats().queueHealth}
                  </div>
                  <div className="text-sm text-gray-600">Health</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trail' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  AI-Generated Trail
                </h2>
                <button
                  onClick={handleGenerateDemoTrail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate New Trail
                </button>
              </div>
              
              {generatedTrail ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {generatedTrail.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{generatedTrail.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {generatedTrail.stops.length}
                        </div>
                        <div className="text-sm text-gray-600">Stops</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(generatedTrail.totalDuration / 60)}
                        </div>
                        <div className="text-sm text-gray-600">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${generatedTrail.totalEstimatedCost}
                        </div>
                        <div className="text-sm text-gray-600">Budget</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {generatedTrail.difficulty}
                        </div>
                        <div className="text-sm text-gray-600">Difficulty</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Trail Stops</h4>
                    {generatedTrail.stops.map((stop: any, index: number) => (
                      <div
                        key={stop.amenityId}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{stop.name}</h5>
                          <p className="text-sm text-gray-600">{stop.category}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{stop.estimatedDuration} min</div>
                          <div>${stop.estimatedCost}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    No trail generated yet. Click the button above to create a personalized shopping trail.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

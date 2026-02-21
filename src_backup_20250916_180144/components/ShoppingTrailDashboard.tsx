import React, { useState, useEffect } from 'react';
import { BentoCard } from './ui/BentoCard';
import { ProgressRing } from './ui/ProgressRing';
import { LiveLeaderboard } from './ui/LiveLeaderboard';
import { shoppingTrailService } from '../services/shoppingTrailService';
import { locationManager } from '../services/locationManager';
import { smartQueue, ActionType, Priority } from '../services/smartQueue';
import { aiTrailGenerator, UserPreferences } from '../services/aiTrailGenerator';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface ShoppingTrailDashboardProps {
  className?: string;
}

export const ShoppingTrailDashboard: React.FC<ShoppingTrailDashboardProps> = ({
  className
}) => {
  const { user } = useAuth();
  const [completionStats, setCompletionStats] = useState<any>(null);
  const [collectionDetails, setCollectionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('idle');
  const [queueStats, setQueueStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      initializeLocationTracking();
      initializeQueueMonitoring();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load completion stats
      const stats = await shoppingTrailService.getCompletionStats(user?.id);
      setCompletionStats(stats);
      
      // Load collection details
      const collection = await shoppingTrailService.getCollectionDetails();
      setCollectionDetails(collection);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeLocationTracking = () => {
    locationManager.onModeChange((mode) => {
      setLocationStatus(`Tracking: ${mode}`);
    });

    locationManager.onLocationUpdate((position) => {
      // Handle location updates
      console.log('Location update:', position.coords);
      
      // Queue location update for processing
      smartQueue.enqueue({
        type: ActionType.LOCATION_UPDATE,
        priority: Priority.HIGH,
        payload: {
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        },
        maxRetries: 3,
        metadata: {
          userId: user?.id,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }
      });
    });
  };

  const initializeQueueMonitoring = () => {
    // Monitor queue stats every 5 seconds
    const interval = setInterval(() => {
      const stats = smartQueue.getStats();
      const status = smartQueue.getStatus();
      setQueueStats({ ...stats, ...status });
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleStartLocationTracking = async () => {
    try {
      await locationManager.startTracking();
      setLocationStatus('active');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      setLocationStatus('error');
    }
  };

  const handleStopLocationTracking = () => {
    locationManager.stopTracking();
    setLocationStatus('idle');
  };

  const handleGenerateTrail = async () => {
    if (!user) return;

    try {
      const preferences: UserPreferences = {
        userId: user.id,
        interests: ['Shopping', 'Fashion', 'Food'],
        budget: { min: 20, max: 200, currency: 'SGD' },
        duration: 3,
        pace: 'moderate',
        accessibility: 'standard',
        groupSize: 1,
        weatherPreference: 'mixed',
        timeOfDay: 'afternoon'
      };

      const trail = await aiTrailGenerator.generateAITrail(preferences, {
        avoidCrowds: true,
        minimizeWalking: false,
        maximizeVariety: true
      });

      console.log('Generated trail:', trail);
      
      // Queue trail generation for analytics
      smartQueue.enqueue({
        type: ActionType.ANALYTICS,
        priority: Priority.MEDIUM,
        payload: {
          event: 'trail_generated_manual',
          trailId: trail.id,
          userId: user.id
        },
        maxRetries: 3,
        metadata: { userId: user.id }
      });

    } catch (error) {
      console.error('Failed to generate trail:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center text-red-600 p-8', className)}>
        <p className="text-lg font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Singapore Shopping Trail
        </h1>
        <p className="text-gray-600">
          Discover the best shopping experiences at Changi Airport
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Progress Card */}
        <BentoCard size="large" gradient={['#667eea', '#764ba2']}>
          <div className="flex flex-col items-center justify-center h-full">
            <h3 className="text-white text-lg font-semibold mb-4">Your Progress</h3>
            <ProgressRing 
              percentage={completionStats?.percentage || 0} 
              size={120}
              showLabel={true}
            />
            <div className="text-center mt-4 text-white">
              <p className="text-sm opacity-80">
                {completionStats?.visited || 0} of {completionStats?.total || 0} visited
              </p>
              <p className="text-xs opacity-60 mt-1">
                ${completionStats?.total_spent || 0} spent
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Live Leaderboard */}
        <BentoCard size="small" live>
          <LiveLeaderboard compact />
        </BentoCard>

        {/* Location Status */}
        <BentoCard size="small">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Location Tracking</h3>
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                locationStatus === 'active' ? 'bg-green-500' :
                locationStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              )} />
              <span className="text-sm text-gray-600">{locationStatus}</span>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleStartLocationTracking}
                disabled={locationStatus === 'active'}
                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Tracking
              </button>
              <button
                onClick={handleStopLocationTracking}
                disabled={locationStatus !== 'active'}
                className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        </BentoCard>

        {/* AI Trail Generator */}
        <BentoCard size="medium" gradient={['#f093fb', '#f5576c']}>
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">AI Trail Generator</h3>
            <p className="text-white/80 text-sm">
              Get personalized shopping trails based on your preferences
            </p>
            <button
              onClick={handleGenerateTrail}
              className="w-full px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              Generate Trail
            </button>
          </div>
        </BentoCard>

        {/* Queue Status */}
        <BentoCard size="small">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">System Status</h3>
            {queueStats && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Queue Health:</span>
                  <span className={cn(
                    'font-medium',
                    queueStats.queueHealth === 'excellent' ? 'text-green-600' :
                    queueStats.queueHealth === 'good' ? 'text-blue-600' :
                    queueStats.queueHealth === 'fair' ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {queueStats.queueHealth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium">{queueStats.pendingActions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">{queueStats.completedActions}</span>
                </div>
              </div>
            )}
          </div>
        </BentoCard>

        {/* Quick Actions */}
        <BentoCard size="small">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Check In
              </button>
              <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                Rate Experience
              </button>
              <button className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                Record Purchase
              </button>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Collection Info */}
      {collectionDetails && (
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {collectionDetails.name}
            </h2>
            <p className="text-gray-600 mb-4">
              {collectionDetails.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {collectionDetails.total_amenities}
                </div>
                <div className="text-sm text-gray-600">Total Amenities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {collectionDetails.featured_count}
                </div>
                <div className="text-sm text-gray-600">Featured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completionStats?.remaining || 0}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

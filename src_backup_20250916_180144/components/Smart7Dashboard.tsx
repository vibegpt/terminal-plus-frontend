import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useTracking } from '../hooks/useTracking';
import { useSupabaseData } from '../hooks/useSupabaseData';

// Components
import { Smart7Badge } from '../components/Smart7Badge';
import { RefreshButton } from '../components/RefreshButton';

// Types
interface SessionStats {
  totalInteractions: number;
  uniqueAmenities: number;
  favoriteTerminal: string;
  avgSessionTime: number;
  topCategories: { category: string; count: number }[];
  peakHour: number;
  engagementScore: number;
}

interface RecentActivity {
  id: string;
  type: 'view' | 'click' | 'bookmark' | 'share';
  amenityName: string;
  amenityId: number;
  collectionName: string;
  timestamp: Date;
  terminal: string;
}

interface InsightCard {
  id: string;
  type: 'achievement' | 'pattern' | 'recommendation' | 'tip';
  title: string;
  description: string;
  icon: string;
  color: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Smart7DashboardProps {
  enableAnalytics?: boolean;
  enableInsights?: boolean;
  enableActivityTracking?: boolean;
  defaultSection?: 'overview' | 'activity' | 'insights';
  className?: string;
  showQuickActions?: boolean;
}

export const Smart7Dashboard: React.FC<Smart7DashboardProps> = ({
  enableAnalytics = true,
  enableInsights = true,
  enableActivityTracking = true,
  defaultSection = 'overview',
  className = '',
  showQuickActions = true
}) => {
  const navigate = useNavigate();
  
  // State
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [activeSection, setActiveSection] = useState<'overview' | 'activity' | 'insights'>(defaultSection);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data & Tracking
  const { 
    sessionId, 
    interactionCount, 
    trackView,
    sessionId: currentSessionId
  } = useTracking({
    pageType: 'dashboard'
  });
  
  const { 
    collections, 
    amenities,
    loading 
  } = useSupabaseData();

  // Track page view on mount
  useEffect(() => {
    if (enableAnalytics) {
      trackView();
    }
  }, [trackView, enableAnalytics]);

  // Mock session analytics for now - replace with actual data
  const sessionAnalytics = useMemo(() => ({
    avgSessionDuration: 25 * 60 * 1000, // 25 minutes in milliseconds
    totalSessions: 12,
    lastSessionDate: new Date()
  }), []);

  // Mock session history for now - replace with actual data
  const getSessionHistory = useCallback(() => {
    if (!currentSessionId) return null;
    
    try {
      const stored = sessionStorage.getItem(`smart7_session_${currentSessionId}`);
      return stored ? JSON.parse(stored) : { interactions: [] };
    } catch (error) {
      console.warn('Failed to parse session history:', error);
      return { interactions: [] };
    }
  }, [currentSessionId]);

  // Calculate session statistics
  const sessionStats = useMemo((): SessionStats => {
    const history = getSessionHistory();
    const interactions = history?.interactions || [];
    
    // Calculate unique amenities
    const uniqueAmenities = new Set(interactions.map((i: any) => i.amenityId)).size;
    
    // Find favorite terminal
    const terminalCounts = interactions.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.terminal] = (acc[curr.terminal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteTerminal = Object.entries(terminalCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'T1';
    
    // Calculate categories
    const categoryCounts = interactions.reduce((acc: Record<string, number>, curr: any) => {
      const amenity = amenities.find(a => a.id === curr.amenityId);
      if (amenity?.vibe_tags) {
        const tags = amenity.vibe_tags.split(',');
        tags.forEach(tag => {
          acc[tag.trim()] = (acc[tag.trim()] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Find peak hour
    const hourCounts = interactions.reduce((acc: Record<number, number>, curr: any) => {
      const hour = new Date(curr.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 12;
    
    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, 
      (uniqueAmenities * 5) + 
      (interactions.filter((i: any) => i.type === 'click').length * 3) +
      (interactions.filter((i: any) => i.type === 'bookmark').length * 10)
    );
    
    return {
      totalInteractions: interactions.length,
      uniqueAmenities,
      favoriteTerminal,
      avgSessionTime: sessionAnalytics?.avgSessionDuration || 0,
      topCategories,
      peakHour: parseInt(peakHour.toString()),
      engagementScore
    };
  }, [amenities, getSessionHistory, sessionAnalytics]);

  // Get recent activity
  const recentActivity = useMemo((): RecentActivity[] => {
    if (!enableActivityTracking) return [];
    
    const history = getSessionHistory();
    const interactions = history?.interactions || [];
    
    return interactions
      .slice(-10)
      .reverse()
      .map((interaction: any) => {
        const amenity = amenities.find(a => a.id === interaction.amenityId);
        const collection = collections.find(c => c.id === interaction.collectionId);
        
        return {
          id: `${interaction.amenityId}-${interaction.timestamp}`,
          type: interaction.type,
          amenityName: amenity?.name || 'Unknown',
          amenityId: interaction.amenityId,
          collectionName: collection?.name || 'Unknown',
          timestamp: new Date(interaction.timestamp),
          terminal: amenity?.terminal_code || 'T1'
        };
      });
  }, [amenities, collections, getSessionHistory, enableActivityTracking]);

  // Generate personalized insights
  const insights = useMemo((): InsightCard[] => {
    if (!enableInsights) return [];
    
    const insights: InsightCard[] = [];
    
    // Achievement insights
    if (sessionStats.uniqueAmenities >= 10) {
      insights.push({
        id: 'explorer',
        type: 'achievement',
        title: 'Explorer Badge Earned!',
        description: `You've discovered ${sessionStats.uniqueAmenities} unique amenities`,
        icon: '🏆',
        color: 'from-yellow-400 to-orange-500',
        action: {
          label: 'View All',
          onClick: () => navigate('/collections')
        }
      });
    }
    
    // Pattern insights
    if (sessionStats.peakHour) {
      const hourLabel = sessionStats.peakHour < 12 
        ? `${sessionStats.peakHour}am` 
        : sessionStats.peakHour === 12 
        ? '12pm' 
        : `${sessionStats.peakHour - 12}pm`;
      
      insights.push({
        id: 'peak-time',
        type: 'pattern',
        title: 'Your Peak Travel Time',
        description: `You're most active around ${hourLabel}. We'll prioritize venues open at this time.`,
        icon: '⏰',
        color: 'from-blue-400 to-cyan-500'
      });
    }
    
    // Recommendation insights
    if (sessionStats.favoriteTerminal) {
      insights.push({
        id: 'terminal-preference',
        type: 'recommendation',
        title: `Terminal ${sessionStats.favoriteTerminal} Specialist`,
        description: `You spend most time in ${sessionStats.favoriteTerminal}. Discover hidden gems there!`,
        icon: '✈️',
        color: 'from-purple-400 to-pink-500',
        action: {
          label: 'Explore T' + sessionStats.favoriteTerminal,
          onClick: () => navigate(`/terminal/${sessionStats.favoriteTerminal}`)
        }
      });
    }
    
    // Tip insights
    if (sessionStats.engagementScore < 50) {
      insights.push({
        id: 'engagement-tip',
        type: 'tip',
        title: 'Pro Tip: Use Bookmarks',
        description: 'Save your favorite spots for quick access on your next visit',
        icon: '💡',
        color: 'from-green-400 to-teal-500'
      });
    }
    
    // Category insight
    if (sessionStats.topCategories.length > 0) {
      const topCategory = sessionStats.topCategories[0];
      insights.push({
        id: 'category-preference',
        type: 'pattern',
        title: `${topCategory.category} Enthusiast`,
        description: `You love ${topCategory.category} venues! We'll show you more like these.`,
        icon: '❤️',
        color: 'from-pink-400 to-rose-500'
      });
    }
    
    return insights;
  }, [sessionStats, navigate, enableInsights]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // Get greeting based on time
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Get activity icon
  const getActivityIcon = useCallback((type: string) => {
    const icons = {
      view: '👁',
      click: '👆',
      bookmark: '⭐',
      share: '📤'
    };
    return icons[type as keyof typeof icons] || '📍';
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Smart7Badge size="lg" pulse variant="premium" />
          <p className="mt-4 text-gray-600">Loading your Smart7 dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, Traveler!</h1>
              <p className="text-gray-600 mt-1">Your Smart7 journey at a glance</p>
            </div>
            <RefreshButton 
              onClick={handleRefresh}
              isRefreshing={isRefreshing}
              variant="default"
            />
          </div>
          
          {/* Section tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['overview', 'activity', 'insights'].map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeSection === section
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label={`Switch to ${section} section`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🎯</span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.totalInteractions}</p>
                  <p className="text-xs text-gray-600">Interactions</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">✨</span>
                    <span className="text-xs text-gray-500">Unique</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.uniqueAmenities}</p>
                  <p className="text-xs text-gray-600">Discoveries</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">📍</span>
                    <span className="text-xs text-gray-500">Favorite</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.favoriteTerminal}</p>
                  <p className="text-xs text-gray-600">Terminal</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🔥</span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.engagementScore}</p>
                  <p className="text-xs text-gray-600">Engagement</p>
                </motion.div>
              </div>

              {/* Engagement Chart */}
              {sessionStats.topCategories.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Your Travel Style</h3>
                  <div className="space-y-4">
                    {sessionStats.topCategories.map((cat, index) => (
                      <div key={cat.category} className="flex items-center space-x-3">
                        <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                            <span className="text-xs text-gray-500">{cat.count} visits</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(cat.count / Math.max(sessionStats.totalInteractions, 1)) * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {showQuickActions && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/collections')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 text-center shadow-lg"
                    aria-label="Browse collections"
                  >
                    <span className="text-2xl block mb-1">🗂</span>
                    <span className="text-sm font-medium">Browse Collections</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/bookmarks')}
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-4 text-center shadow-lg"
                    aria-label="View bookmarks"
                  >
                    <span className="text-2xl block mb-1">⭐</span>
                    <span className="text-sm font-medium">My Bookmarks</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/trending')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl p-4 text-center shadow-lg"
                    aria-label="View trending"
                  >
                    <span className="text-2xl block mb-1">🔥</span>
                    <span className="text-sm font-medium">Trending Now</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/settings')}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl p-4 text-center shadow-lg"
                    aria-label="Open settings"
                  >
                    <span className="text-2xl block mb-1">⚙️</span>
                    <span className="text-sm font-medium">Settings</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Activity Section */}
          {activeSection === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                        onClick={() => navigate(`/amenity/${activity.amenityId}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/amenity/${activity.amenityId}`);
                          }
                        }}
                        aria-label={`View ${activity.amenityName} amenity`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{activity.amenityName}</p>
                            <p className="text-sm text-gray-600">
                              {activity.collectionName} • {activity.terminal}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <span className="text-4xl block mb-2">📭</span>
                      <p>No activity yet. Start exploring!</p>
                      <button
                        onClick={() => navigate('/collections')}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Browse Collections
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Insights Section */}
          {activeSection === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className={`h-2 bg-gradient-to-r ${insight.color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{insight.icon}</span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium`}>
                          {insight.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
                      {insight.action && (
                        <button
                          onClick={insight.action.onClick}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {insight.action.label} →
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <span className="text-4xl block mb-2">💡</span>
                  <p>No insights yet. Keep exploring to unlock personalized recommendations!</p>
                  <button
                    onClick={() => navigate('/collections')}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Exploring
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

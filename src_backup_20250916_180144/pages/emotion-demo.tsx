import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Coffee, Clock, Activity, Settings, Play, Pause } from 'lucide-react';
import EmotionDetectionUI from '@/components/EmotionDetectionUI';
import EmotionHistory from '@/components/EmotionHistory';
import { useVoiceEmotion } from '@/hooks/useVoiceEmotion';

const EmotionDemo: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const { emotionHistory, getEmotionalInsights, clearEmotionHistory } = useVoiceEmotion();
  
  const insights = getEmotionalInsights();

  // Mock emotion data for demo
  const mockEmotions = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      emotion: 'excited',
      confidence: 0.85,
      journeyPhase: 'departure' as const,
      location: 'Security Check'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      emotion: 'focused',
      confidence: 0.72,
      journeyPhase: 'transit' as const,
      location: 'Gate Area'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      emotion: 'relaxed',
      confidence: 0.91,
      journeyPhase: 'arrival' as const,
      location: 'Lounge'
    }
  ];

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'excited':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'relaxed':
        return <Heart className="w-5 h-5 text-green-500" />;
      case 'focused':
        return <Coffee className="w-5 h-5 text-blue-500" />;
      case 'stressed':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎭 Enhanced Emotion Detection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Experience the magical, non-intrusive emotion detection system that adapts to your journey.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <div>
                <p className="text-yellow-800 font-medium">Demo Mode - Mock Emotion Detection</p>
                <p className="text-yellow-700 text-sm">
                  This demo uses preset responses. Real emotion detection would analyze your voice patterns.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ambient Awareness</h3>
            </div>
            <p className="text-gray-600">
              The system quietly monitors audio patterns and gently suggests emotion detection when appropriate.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Real-Time Feedback</h3>
            </div>
            <p className="text-gray-600">
              Get instant emotional insights with confidence rings and contextual suggestions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Journey Mapping</h3>
            </div>
            <p className="text-gray-600">
              Track your emotional journey through departure, transit, and arrival phases.
            </p>
          </div>
        </motion.div>

        {/* Demo Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Demo Controls</h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setAutoRecord(!autoRecord)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    autoRecord 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {autoRecord ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {autoRecord ? 'Stop Auto Recording' : 'Start Auto Recording'}
                </button>
                
                <button
                  onClick={clearEmotionHistory}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Advanced Features</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Ambient listening mode</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Haptic feedback patterns</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Waveform visualization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>User validation & learning</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Live Demo */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Live Demo</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Use the floating emotion detection interface to experience the system in action.
              </p>
              
              {/* Mock Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium text-blue-900">System Active</span>
                </div>
                <p className="text-sm text-blue-700">
                  Ready to detect emotions. Tap the floating button to start recording.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{emotionHistory.length}</div>
                  <div className="text-sm text-gray-500">Emotions Recorded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights.averageConfidence > 0 ? Math.round(insights.averageConfidence * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 capitalize">
                    {insights.dominantEmotion !== 'none' ? insights.dominantEmotion : 'None'}
                  </div>
                  <div className="text-sm text-gray-500">Dominant Emotion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Emotion History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Emotion History</h2>
            <EmotionHistory
              emotions={mockEmotions}
              className="h-96"
            />
          </div>
        </motion.div>

        {/* Integration Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-lg p-6 mt-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Integration Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Smart Recommendations</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  {getEmotionIcon('excited')}
                  <span>Excited → Suggest adventurous activities</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getEmotionIcon('relaxed')}
                  <span>Relaxed → Recommend quiet spaces</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getEmotionIcon('stressed')}
                  <span>Stressed → Suggest calming amenities</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Journey Phases</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Departure: Check-in, security, boarding</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Transit: Waiting, shopping, dining</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span>Arrival: Disembarking, customs, exit</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Emotion Detection UI */}
      <EmotionDetectionUI 
        showHistory={true}
        showCalibration={true}
      />
    </div>
  );
};

export default EmotionDemo; 
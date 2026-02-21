import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, TrendingUp, TrendingDown, Activity, Heart, Zap, Coffee } from 'lucide-react';
import { useVibeColors } from '@/hooks/useVibeColors';

interface EmotionJourneyPoint {
  id: string;
  timestamp: Date;
  emotion: string;
  confidence: number;
  journeyPhase: 'departure' | 'transit' | 'arrival';
  location?: string;
  userValidated?: boolean;
}

interface EmotionHistoryProps {
  emotions: EmotionJourneyPoint[];
  onEmotionSelect?: (emotion: EmotionJourneyPoint) => void;
  className?: string;
}

interface EmotionInsight {
  dominantEmotion: string;
  averageConfidence: number;
  phaseBreakdown: Record<string, number>;
  trend: 'improving' | 'declining' | 'stable';
  suggestion: string;
}

const EmotionHistory: React.FC<EmotionHistoryProps> = ({
  emotions,
  onEmotionSelect,
  className = ''
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'departure' | 'transit' | 'arrival'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'insights'>('timeline');
  const { getVibeColor } = useVibeColors();

  // Filter emotions by selected phase
  const filteredEmotions = useMemo(() => {
    if (selectedPhase === 'all') return emotions;
    return emotions.filter(emotion => emotion.journeyPhase === selectedPhase);
  }, [emotions, selectedPhase]);

  // Calculate insights
  const insights = useMemo((): EmotionInsight => {
    if (emotions.length === 0) {
      return {
        dominantEmotion: 'none',
        averageConfidence: 0,
        phaseBreakdown: {},
        trend: 'stable',
        suggestion: 'No emotions recorded yet.'
      };
    }

    // Dominant emotion
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Average confidence
    const averageConfidence = emotions.reduce((sum, emotion) => sum + emotion.confidence, 0) / emotions.length;

    // Phase breakdown
    const phaseBreakdown = emotions.reduce((acc, emotion) => {
      acc[emotion.journeyPhase] = (acc[emotion.journeyPhase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Trend analysis
    const sortedEmotions = [...emotions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstHalf = sortedEmotions.slice(0, Math.ceil(sortedEmotions.length / 2));
    const secondHalf = sortedEmotions.slice(Math.ceil(sortedEmotions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.confidence, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.confidence, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalf.length > 0) {
      if (secondAvg > firstAvg + 0.1) trend = 'improving';
      else if (secondAvg < firstAvg - 0.1) trend = 'declining';
    }

    // Generate suggestion
    let suggestion = '';
    if (trend === 'improving') {
      suggestion = 'Your mood has been improving throughout your journey!';
    } else if (trend === 'declining') {
      suggestion = 'Consider taking a moment to relax or find a quiet space.';
    } else {
      suggestion = 'Your emotional state has been relatively stable.';
    }

    return {
      dominantEmotion,
      averageConfidence,
      phaseBreakdown,
      trend,
      suggestion
    };
  }, [emotions]);

  // Get emotion icon
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'excited':
        return <Zap className="w-4 h-4" />;
      case 'relaxed':
        return <Heart className="w-4 h-4" />;
      case 'focused':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Get phase icon
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'departure':
        return <MapPin className="w-4 h-4" />;
      case 'transit':
        return <Clock className="w-4 h-4" />;
      case 'arrival':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (insights.trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emotional Journey</h2>
          <p className="text-sm text-gray-500">
            {emotions.length} emotions recorded
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'insights' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      {/* Phase Filter */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'departure', 'transit', 'arrival'] as const).map(phase => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPhase === phase
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {phase === 'all' ? 'All' : phase.charAt(0).toUpperCase() + phase.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'timeline' ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {filteredEmotions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No emotions recorded for this phase.</p>
              </div>
            ) : (
              filteredEmotions.map((emotion, index) => (
                <motion.div
                  key={emotion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onEmotionSelect?.(emotion)}
                  className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Emotion Icon */}
                  <div className={`w-10 h-10 rounded-full ${getVibeColor(emotion.emotion)} flex items-center justify-center text-white`}>
                    {getEmotionIcon(emotion.emotion)}
                  </div>

                  {/* Emotion Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 capitalize">{emotion.emotion}</h3>
                      <span className="text-xs text-gray-500">
                        {Math.round(emotion.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {getPhaseIcon(emotion.journeyPhase)}
                      <span className="capitalize">{emotion.journeyPhase}</span>
                      {emotion.location && (
                        <>
                          <span>•</span>
                          <span>{emotion.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-sm text-gray-400">
                    {emotion.timestamp.toLocaleTimeString()}
                  </div>

                  {/* Validation Status */}
                  {emotion.userValidated !== undefined && (
                    <div className={`w-3 h-3 rounded-full ${
                      emotion.userValidated ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-blue-900">Dominant Emotion</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900 capitalize">
                  {insights.dominantEmotion}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium text-green-900">Average Confidence</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(insights.averageConfidence * 100)}%
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getTrendIcon()}
                  <h3 className="font-medium text-purple-900">Trend</h3>
                </div>
                <p className="text-2xl font-bold text-purple-900 capitalize">
                  {insights.trend}
                </p>
              </div>
            </div>

            {/* Phase Breakdown */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Emotions by Journey Phase</h3>
              <div className="space-y-2">
                {Object.entries(insights.phaseBreakdown).map(([phase, count]) => (
                  <div key={phase} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getPhaseIcon(phase)}
                      <span className="font-medium capitalize">{phase}</span>
                    </div>
                    <span className="text-sm text-gray-500">{count} emotions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestion */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Suggestion</h3>
              <p className="text-yellow-800">{insights.suggestion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionHistory; 
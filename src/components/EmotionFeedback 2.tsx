import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Coffee, Clock, Smile, Frown, Meh, TrendingUp, TrendingDown } from 'lucide-react';
import { useVibeColors } from '@/hooks/useVibeColors';

interface EmotionFeedbackProps {
  emotion: string;
  confidence: number;
  timestamp: Date;
  onExpand?: () => void;
  onValidate?: (validated: boolean) => void;
  className?: string;
}

interface EmotionInsight {
  title: string;
  description: string;
  suggestion: string;
  icon: React.ReactNode;
}

const EmotionFeedback: React.FC<EmotionFeedbackProps> = ({
  emotion,
  confidence,
  timestamp,
  onExpand,
  onValidate,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { getVibeColor } = useVibeColors();

  // Get emotion insights
  const getEmotionInsight = (): EmotionInsight => {
    switch (emotion) {
      case 'excited':
        return {
          title: 'Feeling Energetic!',
          description: 'Your voice shows enthusiasm and high energy.',
          suggestion: 'Perfect time to explore new amenities or try something adventurous!',
          icon: <Zap className="w-5 h-5" />
        };
      case 'relaxed':
        return {
          title: 'Feeling Calm',
          description: 'Your voice indicates a peaceful, relaxed state.',
          suggestion: 'Great for enjoying quiet spaces or gentle activities.',
          icon: <Heart className="w-5 h-5" />
        };
      case 'focused':
        return {
          title: 'Feeling Focused',
          description: 'Your voice shows concentration and determination.',
          suggestion: 'Ideal for work areas or activities requiring attention.',
          icon: <Coffee className="w-5 h-5" />
        };
      case 'neutral':
        return {
          title: 'Feeling Balanced',
          description: 'Your voice shows a calm, neutral state.',
          suggestion: 'Good time to explore and discover new things.',
          icon: <Smile className="w-5 h-5" />
        };
      case 'stressed':
        return {
          title: 'Feeling a Bit Tense',
          description: 'Your voice indicates some tension or worry.',
          suggestion: 'Consider a calming activity or quiet space to relax.',
          icon: <Clock className="w-5 h-5" />
        };
      default:
        return {
          title: 'Emotion Detected',
          description: `You seem to be feeling ${emotion}.`,
          suggestion: 'Take a moment to check in with yourself.',
          icon: <Smile className="w-5 h-5" />
        };
    }
  };

  // Get confidence ring color
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get confidence ring size
  const getConfidenceSize = () => {
    return Math.max(0.3, confidence) * 100;
  };

  // Get contextual emoji
  const getContextualEmoji = () => {
    switch (emotion) {
      case 'excited':
        return '⚡';
      case 'relaxed':
        return '😌';
      case 'focused':
        return '🎯';
      case 'stressed':
        return '😰';
      default:
        return '🤔';
    }
  };

  // Handle validation
  const handleValidation = (validated: boolean) => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      onValidate?.(validated);
    }, 1000);
  };

  const insight = getEmotionInsight();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-lg p-4 ${className}`}
    >
      {/* Main Emotion Display */}
      <div className="flex items-center space-x-3 mb-3">
        {/* Confidence Ring */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <motion.div
              className={`w-8 h-8 rounded-full ${getVibeColor(emotion)} flex items-center justify-center`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {insight.icon}
            </motion.div>
          </div>
          
          {/* Confidence Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: confidence >= 0.8 ? '#10b981' : confidence >= 0.6 ? '#f59e0b' : '#ef4444',
              transform: 'rotate(-90deg)'
            }}
            initial={{ strokeDasharray: 0, strokeDashoffset: 0 }}
            animate={{ 
              strokeDasharray: `${getConfidenceSize()}, 100`,
              strokeDashoffset: 0 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Emotion Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getContextualEmoji()}</span>
            <h3 className="font-semibold text-gray-900 capitalize">{emotion}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {Math.round(confidence * 100)}% confidence
          </p>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </motion.div>
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-3 mt-3"
          >
            {/* Insight */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              <p className="text-sm text-blue-600 font-medium">{insight.suggestion}</p>
            </div>

            {/* Validation */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleValidation(true)}
                disabled={isValidating}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isValidating ? 'Validating...' : 'That\'s right'}
              </button>
              <button
                onClick={() => handleValidation(false)}
                disabled={isValidating}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isValidating ? 'Validating...' : 'Not quite'}
              </button>
            </div>

            {/* Time Context */}
            <div className="mt-3 text-xs text-gray-400">
              Detected at {timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Validation (when not expanded) */}
      {!isExpanded && (
        <div className="flex space-x-1 mt-2">
          <button
            onClick={() => handleValidation(true)}
            className="flex-1 bg-green-100 text-green-700 py-1 px-2 rounded text-xs font-medium hover:bg-green-200 transition-colors"
          >
            ✓
          </button>
          <button
            onClick={() => handleValidation(false)}
            className="flex-1 bg-red-100 text-red-700 py-1 px-2 rounded text-xs font-medium hover:bg-red-200 transition-colors"
          >
            ✗
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default EmotionFeedback; 
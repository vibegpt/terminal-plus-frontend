import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Activity, Heart, Zap, Coffee, Clock } from 'lucide-react';
import EmotionCaptureInterface from './EmotionCaptureInterface';
import EmotionFeedback from './EmotionFeedback';
import EmotionHistory from './EmotionHistory';
import MoodCalibration from './MoodCalibration';
import { useVoiceEmotion } from '@/hooks/useVoiceEmotion';
import { useAnalytics } from '@/context/AnalyticsContext';

interface EmotionDetectionUIProps {
  className?: string;
  showHistory?: boolean;
  showCalibration?: boolean;
}

const EmotionDetectionUI: React.FC<EmotionDetectionUIProps> = ({
  className = '',
  showHistory = true,
  showCalibration = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<any>(null);
  
  const {
    emotionResult,
    emotionHistory,
    confidence,
    getEmotionalInsights,
    validateEmotion,
    addEmotionToHistory
  } = useVoiceEmotion();
  
  const { trackEmotionChange } = useAnalytics();

  // Show feedback when emotion is detected
  useEffect(() => {
    if (emotionResult) {
      setShowFeedback(true);
      setSelectedEmotion(emotionResult);
      
      // Auto-hide feedback after 5 seconds
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [emotionResult]);

  // Handle emotion detection
  const handleEmotionDetected = (emotion: any) => {
    console.log('🎯 Emotion detected:', emotion);
    setSelectedEmotion(emotion);
    setShowFeedback(true);
    
    // Track emotion analytics
    trackEmotionChange(emotion.emotion, emotion.confidence);
  };

  // Handle emotion validation
  const handleEmotionValidation = (validated: boolean) => {
    if (validated) {
      console.log('✅ Emotion validated as correct');
    } else {
      console.log('❌ Emotion marked as incorrect');
      setShowCalibrationModal(true);
    }
  };

  // Handle calibration
  const handleCalibration = (correctedEmotion: string, energyLevel: number, context?: string) => {
    validateEmotion(correctedEmotion, energyLevel, context);
    setShowCalibrationModal(false);
  };

  // Get insights
  const insights = getEmotionalInsights();

  return (
    <>
      {/* Main Floating Interface */}
      <EmotionCaptureInterface
        onEmotionDetected={handleEmotionDetected}
        onRecordingStart={() => console.log('🎙 Recording started')}
        onRecordingStop={() => console.log('🛑 Recording stopped')}
        className={className}
      />

      {/* Emotion Feedback Overlay */}
      <AnimatePresence>
        {showFeedback && selectedEmotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full"
            >
              <EmotionFeedback
                emotion={selectedEmotion.emotion}
                confidence={selectedEmotion.confidence}
                timestamp={selectedEmotion.timestamp}
                onValidate={handleEmotionValidation}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calibration Modal */}
      <AnimatePresence>
        {showCalibrationModal && selectedEmotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md"
            >
              <MoodCalibration
                detectedEmotion={selectedEmotion.emotion}
                detectedConfidence={selectedEmotion.confidence}
                onCalibrate={handleCalibration}
                onSkip={() => setShowCalibrationModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emotion History Panel */}
      {showHistory && isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-6 top-6 bottom-6 w-96 bg-white rounded-lg shadow-xl z-40 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-900">Emotion History</h2>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <EmotionHistory
                emotions={emotionHistory}
                onEmotionSelect={(emotion) => {
                  setSelectedEmotion(emotion);
                  setShowFeedback(true);
                }}
              />
            </div>

            {/* Insights Footer */}
            {insights.suggestions.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-2">Suggestions</h3>
                <div className="space-y-1">
                  {insights.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Toggle History Button */}
      {showHistory && (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="fixed right-6 top-6 z-30 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      )}

      {/* Ambient Status Indicator */}
      {emotionResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-20 right-6 z-30"
        >
          <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              emotionResult.emotion === 'excited' ? 'bg-yellow-500' :
              emotionResult.emotion === 'relaxed' ? 'bg-green-500' :
              emotionResult.emotion === 'focused' ? 'bg-blue-500' :
              emotionResult.emotion === 'stressed' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm font-medium capitalize">{emotionResult.emotion}</span>
            <span className="text-xs text-gray-500">
              {Math.round(emotionResult.confidence * 100)}%
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default EmotionDetectionUI; 
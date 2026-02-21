import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Frown, Meh, Heart, Zap, Coffee, Clock, Check, X, TrendingUp } from 'lucide-react';

interface MoodCalibrationProps {
  detectedEmotion: string;
  detectedConfidence: number;
  onCalibrate: (correctedEmotion: string, energyLevel: number, context?: string) => void;
  onSkip: () => void;
  className?: string;
}

interface EmotionOption {
  value: string;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
}

const MoodCalibration: React.FC<MoodCalibrationProps> = ({
  detectedEmotion,
  detectedConfidence,
  onCalibrate,
  onSkip,
  className = ''
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState(detectedEmotion);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [context, setContext] = useState('');
  const [step, setStep] = useState<'emotion' | 'energy' | 'context' | 'complete'>('emotion');

  const emotionOptions: EmotionOption[] = [
    {
      value: 'excited',
      label: 'Excited',
      emoji: '⚡',
      icon: <Zap className="w-5 h-5" />,
      description: 'Feeling energetic and enthusiastic'
    },
    {
      value: 'relaxed',
      label: 'Relaxed',
      emoji: '😌',
      icon: <Heart className="w-5 h-5" />,
      description: 'Feeling calm and peaceful'
    },
    {
      value: 'focused',
      label: 'Focused',
      emoji: '🎯',
      icon: <Coffee className="w-5 h-5" />,
      description: 'Feeling concentrated and determined'
    },
    {
      value: 'neutral',
      label: 'Neutral',
      emoji: '😐',
      icon: <Meh className="w-5 h-5" />,
      description: 'Feeling balanced and calm'
    },
    {
      value: 'stressed',
      label: 'A Bit Tense',
      emoji: '😰',
      icon: <Clock className="w-5 h-5" />,
      description: 'Feeling some tension or worry'
    }
  ];

  const handleNext = () => {
    if (step === 'emotion') {
      setStep('energy');
    } else if (step === 'energy') {
      setStep('context');
    } else if (step === 'context') {
      setStep('complete');
      onCalibrate(selectedEmotion, energyLevel, context);
    }
  };

  const handleBack = () => {
    if (step === 'energy') {
      setStep('emotion');
    } else if (step === 'context') {
      setStep('energy');
    }
  };

  const getEnergyDescription = (level: number) => {
    if (level <= 2) return 'Very low energy';
    if (level <= 4) return 'Low energy';
    if (level <= 6) return 'Moderate energy';
    if (level <= 8) return 'High energy';
    return 'Very high energy';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">How are you feeling?</h2>
        <p className="text-sm text-gray-500">
          Help us understand your mood better
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'emotion' && (
          <motion.div
            key="emotion"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Detected Emotion */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-900">We detected:</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {emotionOptions.find(e => e.value === detectedEmotion)?.emoji}
                </span>
                <span className="font-medium text-blue-900 capitalize">
                  {detectedEmotion} ({Math.round(detectedConfidence * 100)}% confidence)
                </span>
              </div>
            </div>

            {/* Emotion Selection */}
            <div className="space-y-2">
              {emotionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedEmotion(option.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedEmotion === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    {selectedEmotion === option.value && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'energy' && (
          <motion.div
            key="energy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Energy Level</h3>
              <p className="text-sm text-gray-500">
                How energetic are you feeling right now?
              </p>
            </div>

            {/* Energy Slider */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
              
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{energyLevel}/10</div>
                <div className="text-sm text-gray-500">{getEnergyDescription(energyLevel)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'context' && (
          <motion.div
            key="context"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Context (Optional)</h3>
              <p className="text-sm text-gray-500">
                What's influencing your mood today?
              </p>
            </div>

            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Traveling with kids, first time flying, running late..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />

            <div className="text-xs text-gray-400">
              This helps us provide better recommendations in the future.
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Thank you!</h3>
            <p className="text-sm text-gray-500">
              Your feedback helps us improve our emotion detection.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {step !== 'complete' && (
        <div className="flex justify-between mt-6">
          <button
            onClick={step === 'emotion' ? onSkip : handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step === 'emotion' ? 'Skip' : 'Back'}
          </button>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {step === 'context' ? 'Save' : 'Next'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MoodCalibration; 
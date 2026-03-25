// src/components/hybrid/ContextHeader.tsx
import React from 'react';
import { Clock, MapPin, Plane, Wifi, Battery, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContextHeaderProps {
  terminal: string;
  gate: string;
  timeToBoarding: number;
  flightStatus: string | null;
  emotionalState: string;
  isListening: boolean;
}

export const ContextHeader: React.FC<ContextHeaderProps> = ({
  terminal,
  gate,
  timeToBoarding,
  flightStatus,
  emotionalState,
  isListening
}) => {
  const getStatusColor = () => {
    if (flightStatus === 'delayed') return 'text-red-500';
    if (flightStatus === 'boarding') return 'text-green-500';
    return 'text-gray-600';
  };

  const getEmotionEmoji = () => {
    const emojiMap: Record<string, string> = {
      happy: '😊',
      stressed: '😰',
      tired: '😴',
      excited: '🤗',
      neutral: '😐',
      sad: '😔',
      angry: '😠'
    };
    return emojiMap[emotionalState] || '😊';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Top Row - Location & Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">Terminal {terminal}</span>
            <span className="text-gray-500">•</span>
            <span className="font-medium text-gray-900">Gate {gate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {timeToBoarding !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              timeToBoarding < 20 ? 'text-red-500' : 'text-gray-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeToBoarding} min</span>
            </div>
          )}
          
          {flightStatus && (
            <div className={`flex items-center gap-1 text-sm ${getStatusColor()}`}>
              <Plane className="w-4 h-4" />
              <span className="capitalize">{flightStatus}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Row - Emotion & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-1 text-sm"
          >
            <span className="text-lg">{getEmotionEmoji()}</span>
            <span className="text-gray-600">Feeling {emotionalState}</span>
            {isListening && (
              <Activity className="w-3 h-3 text-purple-500 animate-pulse" />
            )}
          </motion.div>
        </div>
        
        <div className="flex items-center gap-3 text-gray-500">
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

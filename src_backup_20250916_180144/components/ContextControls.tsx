import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionTracker } from '../utils/sessionTracking';
import { performanceOptimizer } from '../utils/smart7PerformanceOptimizer';
import type { Smart7Context } from '../types/tracking';

interface ContextControlsProps {
  onContextChange: (context: Smart7Context) => void;
  currentContext?: Smart7Context;
  availableTerminals?: string[];
  compact?: boolean;
  floating?: boolean;
  showAdvanced?: boolean;
  enableAutoContext?: boolean;
  className?: string;
}

interface LocalContext {
  userTerminal?: string;
  pricePreference?: 'budget' | 'mid' | 'premium' | 'any';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'auto';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  walkingSpeed?: 'slow' | 'normal' | 'fast';
  layoverDuration?: 'short' | 'medium' | 'long';
  accessibility?: 'standard' | 'wheelchair' | 'reduced-mobility';
}

export const ContextControls: React.FC<ContextControlsProps> = ({
  onContextChange,
  currentContext = {},
  availableTerminals = ['T1', 'T2', 'T3', 'T4'],
  compact = false,
  floating = false,
  showAdvanced = false,
  enableAutoContext = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localContext, setLocalContext] = useState<LocalContext>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout>();

  // Initialize local context from current context
  useEffect(() => {
    const initialContext: LocalContext = {
      userTerminal: currentContext.userTerminal || availableTerminals[0],
      pricePreference: currentContext.pricePreference || 'any',
      timeOfDay: currentContext.timeOfDay || 'auto',
      mealType: currentContext.mealType || 'any',
      walkingSpeed: currentContext.walkingSpeed || 'normal',
      layoverDuration: currentContext.layoverDuration || 'medium',
      accessibility: currentContext.accessibility || 'standard'
    };
    setLocalContext(initialContext);
  }, [currentContext, availableTerminals]);

  // Auto-detect context based on current time and user behavior
  const autoDetectContext = useCallback(async () => {
    if (!enableAutoContext) return;

    setIsAutoDetecting(true);
    
    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Auto-detect time of day
      let detectedTime: LocalContext['timeOfDay'] = 'auto';
      if (hour >= 5 && hour < 12) detectedTime = 'morning';
      else if (hour >= 12 && hour < 17) detectedTime = 'afternoon';
      else if (hour >= 17 && hour < 21) detectedTime = 'evening';
      else detectedTime = 'night';

      // Auto-detect meal type
      let detectedMeal: LocalContext['mealType'] = 'any';
      if (hour >= 6 && hour < 11) detectedMeal = 'breakfast';
      else if (hour >= 11 && hour < 16) detectedMeal = 'lunch';
      else if (hour >= 16 && hour < 22) detectedMeal = 'dinner';
      else detectedMeal = 'snack';

      // Get user preferences from session
      const sessionId = sessionTracker.getSessionId();
      let userPreferences = null;
      
      if (sessionId) {
        try {
          const { supabaseTrackingService } = await import('../services/supabaseTrackingService');
          userPreferences = await supabaseTrackingService.getUserPreferences(sessionId);
        } catch (error) {
          console.warn('Failed to get user preferences for auto-context:', error);
        }
      }

      const autoContext: LocalContext = {
        ...localContext,
        timeOfDay: detectedTime,
        mealType: detectedMeal,
        pricePreference: userPreferences?.preferredPriceLevel?.[0] || 'any',
        walkingSpeed: userPreferences?.engagementPattern === 'quick' ? 'fast' : 'normal'
      };

      setLocalContext(autoContext);
      setHasChanges(true);
      
      // Apply auto-detected context
      setTimeout(() => {
        onContextChange(autoContext as Smart7Context);
        setHasChanges(false);
      }, 100);

    } catch (error) {
      console.error('Auto-context detection failed:', error);
    } finally {
      setIsAutoDetecting(false);
    }
  }, [enableAutoContext, localContext, onContextChange]);

  // Debounced context update
  const handleContextUpdate = useCallback((key: keyof LocalContext, value: any) => {
    const newContext = { ...localContext, [key]: value };
    setLocalContext(newContext);
    setHasChanges(true);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new debounced update
    const timer = setTimeout(() => {
      onContextChange(newContext as Smart7Context);
      setHasChanges(false);
      
      // Track context change for analytics
      try {
        sessionTracker.trackInteraction(0, 'view', {
          context_data: {
            context_update: key,
            new_value: value,
            timestamp: new Date().toISOString()
          }
        } as any);
      } catch (error) {
        console.warn('Failed to track context update:', error);
      }
    }, 500); // Increased debounce for better performance
    
    setDebounceTimer(timer);
  }, [localContext, onContextChange, debounceTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Icon helpers
  const getTimeIcon = useCallback((time: string) => {
    const icons: Record<string, string> = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      night: '🌙',
      auto: '⚡'
    };
    return icons[time] || '🕐';
  }, []);

  const getPriceIcon = useCallback((price: string) => {
    const icons: Record<string, string> = {
      budget: '💰',
      mid: '💳',
      premium: '💎',
      any: '✨'
    };
    return icons[price] || '💵';
  }, []);

  const getWalkingIcon = useCallback((speed: string) => {
    const icons: Record<string, string> = {
      slow: '🚶',
      normal: '🚶‍♀️',
      fast: '🏃'
    };
    return icons[speed] || '🚶';
  }, []);

  const getMealIcon = useCallback((meal: string) => {
    const icons: Record<string, string> = {
      breakfast: '🥐',
      lunch: '🍽️',
      dinner: '🍴',
      snack: '🍿',
      any: '🍽️'
    };
    return icons[meal] || '🍽️';
  }, []);

  const getAccessibilityIcon = useCallback((access: string) => {
    const icons: Record<string, string> = {
      standard: '🚶',
      wheelchair: '♿',
      'reduced-mobility': '🦽'
    };
    return icons[access] || '🚶';
  }, []);

  // Compact mode render
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm ${className}`}>
        {/* Terminal selector - compact */}
        <select
          value={localContext.userTerminal || availableTerminals[0]}
          onChange={(e) => handleContextUpdate('userTerminal', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Select terminal"
        >
          {availableTerminals.map(terminal => (
            <option key={terminal} value={terminal}>{terminal}</option>
          ))}
        </select>

        {/* Price selector - compact */}
        <div className="flex space-x-1">
          {['budget', 'mid', 'premium'].map((price) => (
            <button
              key={price}
              onClick={() => handleContextUpdate('pricePreference', price)}
              className={`
                px-2 py-1 text-sm rounded-md transition-all
                ${localContext.pricePreference === price 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
              aria-label={`Select ${price} price range`}
            >
              {'$'.repeat(price === 'budget' ? 1 : price === 'mid' ? 2 : 3)}
            </button>
          ))}
        </div>

        {/* Auto-detect button */}
        {enableAutoContext && (
          <button
            onClick={autoDetectContext}
            disabled={isAutoDetecting}
            className="px-2 py-1 text-sm bg-purple-100 text-purple-600 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
            aria-label="Auto-detect context"
            title="Auto-detect context based on time and preferences"
          >
            {isAutoDetecting ? '⏳' : '⚡'}
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={`
        ${floating ? 'fixed bottom-20 right-6 z-40' : ''}
        ${isExpanded ? 'w-80' : 'w-auto'}
        ${className}
      `}
      animate={{ width: isExpanded ? 320 : 'auto' }}
    >
      {/* Collapsed state - floating button */}
      {!isExpanded && floating && (
        <motion.button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Expand context controls"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
        </motion.button>
      )}

      {/* Expanded state - full controls */}
      <AnimatePresence>
        {(isExpanded || !floating) && (
          <motion.div
            initial={floating ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <span>Your Preferences</span>
                {hasChanges && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                    aria-label="Changes saved"
                  />
                )}
              </h3>
              <div className="flex items-center space-x-2">
                {/* Auto-detect button */}
                {enableAutoContext && (
                  <button
                    onClick={autoDetectContext}
                    disabled={isAutoDetecting}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Auto-detect context"
                    title="Auto-detect context based on time and preferences"
                  >
                    {isAutoDetecting ? '⏳' : '⚡'}
                  </button>
                )}
                
                {floating && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Collapse controls"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Terminal Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Terminal
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableTerminals.map((terminal) => (
                  <motion.button
                    key={terminal}
                    onClick={() => handleContextUpdate('userTerminal', terminal)}
                    className={`
                      py-2 px-3 rounded-lg font-medium transition-all
                      ${localContext.userTerminal === terminal 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select terminal ${terminal}`}
                  >
                    {terminal}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Price Preference */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Price Range
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'budget', label: '$', icon: '💰' },
                  { key: 'mid', label: '$$', icon: '💳' },
                  { key: 'premium', label: '$$$', icon: '💎' },
                  { key: 'any', label: 'Any', icon: '✨' }
                ].map((price) => (
                  <motion.button
                    key={price.key}
                    onClick={() => handleContextUpdate('pricePreference', price.key)}
                    className={`
                      py-2 px-3 rounded-lg font-medium transition-all flex flex-col items-center
                      ${localContext.pricePreference === price.key 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${price.key} price range`}
                  >
                    <span className="text-lg mb-1">{price.icon}</span>
                    <span className="text-xs">{price.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Preference
              </label>
              <div className="flex space-x-2">
                {['morning', 'afternoon', 'evening', 'night', 'auto'].map((time) => (
                  <motion.button
                    key={time}
                    onClick={() => handleContextUpdate('timeOfDay', time as any)}
                    className={`
                      flex-1 py-2 px-2 rounded-lg transition-all flex flex-col items-center
                      ${localContext.timeOfDay === time 
                        ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${time} time preference`}
                  >
                    <span className="text-xl mb-1">{getTimeIcon(time)}</span>
                    <span className="text-xs capitalize">{time}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Meal Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Meal Preference
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['breakfast', 'lunch', 'dinner', 'snack', 'any'].map((meal) => (
                  <motion.button
                    key={meal}
                    onClick={() => handleContextUpdate('mealType', meal as any)}
                    className={`
                      py-2 px-2 rounded-lg transition-all flex flex-col items-center
                      ${localContext.mealType === meal 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${meal} meal preference`}
                  >
                    <span className="text-lg mb-1">{getMealIcon(meal)}</span>
                    <span className="text-xs capitalize">{meal}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Walking Speed */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Walking Speed
              </label>
              <div className="flex space-x-2">
                {['slow', 'normal', 'fast'].map((speed) => (
                  <motion.button
                    key={speed}
                    onClick={() => handleContextUpdate('walkingSpeed', speed as any)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-2
                      ${localContext.walkingSpeed === speed 
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${speed} walking speed`}
                  >
                    <span className="text-lg">{getWalkingIcon(speed)}</span>
                    <span className="text-sm capitalize">{speed}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <>
                {/* Layover Duration */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Layover Duration
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { key: 'short', label: 'Short', icon: '⏱️' },
                      { key: 'medium', label: 'Medium', icon: '⏰' },
                      { key: 'long', label: 'Long', icon: '🕐' }
                    ].map((duration) => (
                      <motion.button
                        key={duration.key}
                        onClick={() => handleContextUpdate('layoverDuration', duration.key as any)}
                        className={`
                          flex-1 py-2 px-3 rounded-lg transition-all flex flex-col items-center
                          ${localContext.layoverDuration === duration.key 
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Select ${duration.key} layover duration`}
                      >
                        <span className="text-lg mb-1">{duration.icon}</span>
                        <span className="text-xs">{duration.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Accessibility
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'standard', label: 'Standard', icon: '🚶' },
                      { key: 'wheelchair', label: 'Wheelchair', icon: '♿' },
                      { key: 'reduced-mobility', label: 'Reduced', icon: '🦽' }
                    ].map((access) => (
                      <motion.button
                        key={access.key}
                        onClick={() => handleContextUpdate('accessibility', access.key as any)}
                        className={`
                          py-2 px-3 rounded-lg transition-all flex flex-col items-center
                          ${localContext.accessibility === access.key 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Select ${access.label} accessibility option`}
                      >
                        <span className="text-lg mb-1">{getAccessibilityIcon(access.key)}</span>
                        <span className="text-xs">{access.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Apply Changes Indicator */}
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center text-sm text-green-600 font-medium"
                  aria-live="polite"
                >
                  ✓ Preferences updated
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance indicator */}
            <div className="text-xs text-gray-500 text-center">
              Context changes are automatically applied to Smart7 selections
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

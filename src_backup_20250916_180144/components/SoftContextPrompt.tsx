import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Coffee, 
  Bed, 
  Zap, 
  MapPin,
  Clock,
  Plane,
  ChevronRight 
} from 'lucide-react';
import { useSimpleJourneyContext } from '../hooks/useSimpleJourneyContext';

interface ContextOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  energy: 'exhausted' | 'tired' | 'active' | 'neutral' | 'energetic';
  phase: 'arrival' | 'departure' | 'transit' | 'exploring';
  gradient: string;
}

export const SoftContextPrompt: React.FC = () => {
  const {
    location,
    userState,
    timeContext,
    setUserEnergy,
    setPhase,
    setTimeAvailable,
    setManualTerminal
  } = useSimpleJourneyContext();
  
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showTerminalSelect, setShowTerminalSelect] = useState(false);
  
  // Determine if we should show the prompt
  useEffect(() => {
    const shouldShow = 
      !userState.hasAsked && // Haven't asked yet
      (location.confidence < 60 || // Low confidence location
       location.isAtAirport); // Or at airport needing context
       
    setIsVisible(shouldShow);
  }, [userState.hasAsked, location, timeContext]);
  
  // Context options based on time
  const getContextOptions = (): ContextOption[] => {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;
    const isMorning = hour >= 6 && hour < 10;
    
    const options: ContextOption[] = [
      {
        id: 'just-landed-long',
        label: 'Just landed',
        sublabel: 'Long flight, need recovery',
        icon: <Bed className="w-5 h-5" />,
        energy: 'exhausted',
        phase: 'arrival',
        gradient: 'from-purple-500 to-indigo-500'
      },
      {
        id: 'just-landed-short',
        label: 'Just arrived',
        sublabel: 'Short flight, feeling good',
        icon: <Sparkles className="w-5 h-5" />,
        energy: 'energetic',
        phase: 'arrival',
        gradient: 'from-green-500 to-teal-500'
      },
      {
        id: 'departing-soon',
        label: 'Departing soon',
        sublabel: 'Need quick options',
        icon: <Zap className="w-5 h-5" />,
        energy: 'active',
        phase: 'departure',
        gradient: 'from-yellow-500 to-orange-500'
      },
      {
        id: 'long-layover',
        label: 'Long layover',
        sublabel: 'Time to explore',
        icon: <Clock className="w-5 h-5" />,
        energy: 'active',
        phase: 'transit',
        gradient: 'from-blue-500 to-cyan-500'
      },
      {
        id: 'just-browsing',
        label: 'Planning ahead',
        sublabel: 'Not at airport yet',
        icon: <MapPin className="w-5 h-5" />,
        energy: 'energetic',
        phase: 'exploring',
        gradient: 'from-gray-500 to-slate-600'
      }
    ];
    
    // Reorder based on time and likely scenario
    if (isNight) {
      // Red-eye arrivals more likely
      return [options[0], options[2], options[3], options[1], options[4]];
    } else if (isMorning) {
      // Morning arrivals from nearby
      return [options[1], options[2], options[0], options[3], options[4]];
    }
    
    return options;
  };
  
  const handleOptionSelect = (option: ContextOption) => {
    setSelectedOption(option.id);
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Apply context
    setUserEnergy(option.energy);
    setPhase(option.phase);
    
    // Set time available based on selection
    if (option.id === 'departing-soon') {
      setTimeAvailable('rushed');
    } else if (option.id === 'long-layover') {
      setTimeAvailable('leisurely');
    } else if (option.id === 'just-landed-long') {
      setTimeAvailable('moderate');
    }
    
    // If low confidence location and not browsing, show terminal select
    if (location.confidence < 60 && option.phase !== 'exploring') {
      setTimeout(() => setShowTerminalSelect(true), 600);
    } else {
      // Close prompt after selection
      setTimeout(() => setIsVisible(false), 800);
    }
  };
  
  const handleTerminalSelect = (terminal: string) => {
    setManualTerminal(terminal);
    setIsVisible(false);
  };
  
  const handleDismiss = () => {
    // Mark as asked so we don't show again
    setUserEnergy('active'); // Default state
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {!showTerminalSelect ? (
            <>
              {/* Header */}
              <div className="relative p-6 pb-2">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {timeContext.greeting}!
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {location.isAtAirport 
                        ? "Let's personalize your experience" 
                        : "Help us show you the best options"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Options */}
              <div className="p-6 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  What brings you here?
                </p>
                
                {getContextOptions().map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full p-4 rounded-2xl border transition-all ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-r ${option.gradient}`}>
                          {option.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {option.sublabel}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${
                        selectedOption === option.id ? 'translate-x-1' : ''
                      } text-gray-400`} />
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* Skip option */}
              <div className="p-6 pt-2">
                <button
                  onClick={handleDismiss}
                  className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Terminal Selection */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Which terminal?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      We'll show you nearby options
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['T1', 'T2', 'T3', 'T4'] as const).map((terminal) => (
                    <motion.button
                      key={terminal}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTerminalSelect(terminal)}
                      className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                    >
                      Terminal {terminal.replace('T', '')}
                    </motion.button>
                  ))}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTerminalSelect('JEWEL')}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium mb-3"
                >
                  Jewel Changi
                </motion.button>
                
                <button
                  onClick={() => handleTerminalSelect('T1-T2-T3-JEWEL')}
                  className="w-full py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Not sure / Show all
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

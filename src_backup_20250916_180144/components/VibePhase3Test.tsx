import React, { useState, useEffect } from 'react';
import { Clock, Plane, Settings, Play, Pause, FastForward, RefreshCw } from 'lucide-react';
import '../styles/adaptive-luxe.css';

/**
 * Phase 3 Visual Enhancement Test Component
 * Tests all visual states and transitions for the vibe ordering system
 */

interface TestScenario {
  name: string;
  description: string;
  boardingTime: number; // minutes until boarding
  isDelayed: boolean;
  delayMinutes?: number;
  gate?: string;
  timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
}

const testScenarios: TestScenario[] = [
  {
    name: '⚡ Rush Mode',
    description: 'Only 10 minutes to boarding - grab essentials!',
    boardingTime: 10,
    isDelayed: false,
    gate: 'A23',
    timeOfDay: 'morning'
  },
  {
    name: '🍔 Imminent Boarding',
    description: '30 minutes - time for a quick bite',
    boardingTime: 30,
    isDelayed: false,
    gate: 'B15',
    timeOfDay: 'midday'
  },
  {
    name: '😌 Relaxation Time',
    description: '60 minutes - perfect for a meal and lounge',
    boardingTime: 60,
    isDelayed: false,
    gate: 'C7',
    timeOfDay: 'afternoon'
  },
  {
    name: '💼 Productive Wait',
    description: '120 minutes - get work done or shop',
    boardingTime: 120,
    isDelayed: false,
    gate: 'D12',
    timeOfDay: 'evening'
  },
  {
    name: '✨ Extended Layover',
    description: '4+ hours - explore the entire terminal',
    boardingTime: 240,
    isDelayed: false,
    gate: 'E9',
    timeOfDay: 'night'
  },
  {
    name: '🚨 Major Delay',
    description: 'Flight delayed by 3 hours',
    boardingTime: 300,
    isDelayed: true,
    delayMinutes: 180,
    gate: 'F22',
    timeOfDay: 'evening'
  }
];

const VibePhase3TestComponent: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTransitions, setShowTransitions] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [boardingTimeOverride, setBoardingTimeOverride] = useState<number | null>(null);
  
  const currentScenario = testScenarios[selectedScenario];
  const boardingTime = boardingTimeOverride ?? currentScenario.boardingTime;
  
  // Get boarding status based on time
  const getBoardingStatus = (minutes: number) => {
    if (minutes <= 15) return 'rush';
    if (minutes <= 45) return 'imminent';
    if (minutes <= 90) return 'soon';
    if (minutes <= 180) return 'normal';
    return 'extended';
  };
  
  const boardingStatus = getBoardingStatus(boardingTime);
  
  // Auto-play through scenarios
  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        setSelectedScenario(prev => (prev + 1) % testScenarios.length);
        triggerAnimation();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoPlay]);
  
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
  };
  
  const changeScenario = (index: number) => {
    setSelectedScenario(index);
    if (showTransitions) {
      triggerAnimation();
    }
  };
  
  // Mock vibe data with order based on boarding status
  const getVibeOrder = () => {
    const orders = {
      rush: ['quick', 'refuel', 'chill', 'comfort', 'work', 'shop', 'discover'],
      imminent: ['refuel', 'quick', 'chill', 'shop', 'comfort', 'work', 'discover'],
      soon: ['comfort', 'refuel', 'chill', 'shop', 'work', 'quick', 'discover'],
      normal: ['work', 'comfort', 'discover', 'refuel', 'chill', 'shop', 'quick'],
      extended: ['discover', 'comfort', 'refuel', 'work', 'shop', 'chill', 'quick']
    };
    return orders[boardingStatus];
  };
  
  const vibes = getVibeOrder().map((vibe, index) => ({
    key: vibe,
    name: vibe.charAt(0).toUpperCase() + vibe.slice(1),
    emoji: {
      quick: '⚡',
      refuel: '🍔',
      chill: '🧘',
      comfort: '😌',
      work: '💼',
      shop: '🛍️',
      discover: '🗺️'
    }[vibe],
    isHighlighted: index === 0,
    rank: index + 1
  }));
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-[#1a1a2e] text-white">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
        
        .test-control-panel {
          background: rgba(102, 126, 234, 0.1);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .scenario-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .scenario-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .scenario-card.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
          border-color: rgba(102, 126, 234, 0.5);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .vibe-item {
          animation: ${isAnimating && showTransitions ? 'slideIn 0.5s ease-out' : 'none'};
          animation-fill-mode: both;
        }
        
        .status-badge {
          animation: ${isAnimating ? 'pulse 1s ease-out' : 'none'};
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      
      {/* Header */}
      <header className="glass-card m-4 p-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          Phase 3: Visual Enhancements Test Suite
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Test all visual states and transitions for the vibe ordering system
        </p>
      </header>
      
      {/* Control Panel */}
      <div className="test-control-panel m-4 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Test Controls</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransitions(!showTransitions)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${showTransitions 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-white/10 text-white/60 border border-white/20'}`}
            >
              Animations {showTransitions ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 
                       border border-purple-500/30 text-sm font-medium hover:bg-purple-500/30
                       transition-all flex items-center gap-1.5"
            >
              {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoPlay ? 'Pause' : 'Auto Play'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 
                       border border-white/20 text-sm font-medium hover:bg-white/20
                       transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
        
        {/* Time Slider */}
        <div className="mb-4">
          <label className="text-sm text-white/60 mb-2 flex items-center justify-between">
            <span>Boarding Time Override</span>
            <span className="text-white font-medium">
              {boardingTimeOverride !== null ? `${boardingTimeOverride} min` : 'Using scenario default'}
            </span>
          </label>
          <input
            type="range"
            min="5"
            max="360"
            value={boardingTimeOverride ?? boardingTime}
            onChange={(e) => setBoardingTimeOverride(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 
                     [&::-webkit-slider-thumb]:to-pink-500"
          />
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>5m</span>
            <span>45m</span>
            <span>90m</span>
            <span>180m</span>
            <span>360m</span>
          </div>
        </div>
      </div>
      
      {/* Scenario Selector */}
      <div className="m-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Test Scenarios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {testScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => changeScenario(index)}
              className={`scenario-card p-3 rounded-xl text-left
                ${selectedScenario === index ? 'active' : ''}`}
            >
              <div className="font-semibold text-sm mb-1">{scenario.name}</div>
              <div className="text-xs text-white/60">{scenario.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-white/40" />
                <span className="text-xs text-white/40">{scenario.boardingTime}min</span>
                {scenario.isDelayed && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                    Delayed
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Status Display */}
      <div className="m-4">
        <div className={`glass-card p-4 status-badge ${isAnimating ? 'scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Current Status: {boardingStatus.toUpperCase()}</h3>
              <p className="text-white/60 text-sm mt-1">
                {boardingTime} minutes to boarding
                {currentScenario.gate && ` • Gate ${currentScenario.gate}`}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-sm
              ${boardingStatus === 'rush' ? 'bg-red-500/20 text-red-300' :
                boardingStatus === 'imminent' ? 'bg-orange-500/20 text-orange-300' :
                boardingStatus === 'soon' ? 'bg-blue-500/20 text-blue-300' :
                boardingStatus === 'normal' ? 'bg-green-500/20 text-green-300' :
                'bg-purple-500/20 text-purple-300'}`}>
              {boardingStatus === 'rush' ? '⚡ RUSH' :
               boardingStatus === 'imminent' ? '⏰ IMMINENT' :
               boardingStatus === 'soon' ? '☕ SOON' :
               boardingStatus === 'normal' ? '💼 NORMAL' :
               '✨ EXTENDED'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vibe Order Display */}
      <div className="m-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Vibe Priority Order</h3>
        <div className="space-y-2">
          {vibes.map((vibe, index) => (
            <div
              key={vibe.key}
              className="vibe-item glass-card p-3 flex items-center justify-between"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                {vibe.rank <= 3 && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                    font-bold text-sm text-white`}
                    style={{
                      background: vibe.rank === 1 
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : vibe.rank === 2 
                        ? 'linear-gradient(135deg, #C0C0C0, #808080)'
                        : 'linear-gradient(135deg, #CD7F32, #8B4513)'
                    }}>
                    {vibe.rank}
                  </div>
                )}
                
                <span className="text-2xl">{vibe.emoji}</span>
                <span className="font-semibold">{vibe.name}</span>
                
                {/* Context Badge */}
                {vibe.isHighlighted && (
                  <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20
                                border border-purple-500/30 text-xs font-medium">
                    Recommended
                  </div>
                )}
              </div>
              
              {/* Visual Indicator */}
              <div className="flex items-center gap-2">
                {vibe.key === 'quick' && boardingStatus === 'rush' && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded animate-pulse">
                    Closest to gate
                  </span>
                )}
                {vibe.key === 'discover' && boardingStatus === 'extended' && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                    Time to explore
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Visual States Preview */}
      <div className="m-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Visual States</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <h4 className="text-sm font-semibold mb-2">Badge Styles</h4>
            <div className="space-y-2">
              <div className="px-2 py-1 rounded bg-gradient-to-r from-red-500 to-orange-500 
                            text-white text-xs font-bold inline-block animate-pulse">
                ⚡ Rush Mode
              </div>
              <div className="px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 
                            text-white text-xs font-bold inline-block ml-2">
                ✨ Featured
              </div>
              <div className="px-2 py-1 rounded bg-gradient-to-r from-green-500 to-teal-500 
                            text-white text-xs font-bold inline-block">
                🔥 Trending
              </div>
            </div>
          </div>
          
          <div className="glass-card p-3">
            <h4 className="text-sm font-semibold mb-2">Live Indicators</h4>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-white/60">Live Updates</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-xs text-white/60">Busy Now</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white/60">Urgent</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation States */}
      <div className="m-4 mb-20">
        <h3 className="text-sm font-medium text-white/60 mb-3">Animation States</h3>
        <div className="glass-card p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className={`h-16 rounded-lg flex items-center justify-center
                ${isAnimating ? 'animate-pulse bg-purple-500/20' : 'bg-white/5'}`}>
                <span className="text-2xl">📱</span>
              </div>
              <p className="text-xs text-white/60 mt-1">Pulse</p>
            </div>
            <div>
              <div className={`h-16 rounded-lg flex items-center justify-center bg-white/5
                ${isAnimating ? 'animate-bounce' : ''}`}>
                <span className="text-2xl">✈️</span>
              </div>
              <p className="text-xs text-white/60 mt-1">Bounce</p>
            </div>
            <div>
              <div className={`h-16 rounded-lg flex items-center justify-center bg-white/5
                ${isAnimating ? 'animate-spin' : ''}`}>
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-xs text-white/60 mt-1">Spin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibePhase3TestComponent;
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Coffee, Briefcase, ShoppingBag, Zap, Compass, 
  Crown, MapPin, Wifi, Clock, Plane, AlertCircle, Sparkles,
  TrendingUp, Heart, Gauge, Timer, Calendar, Navigation
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAmenities, useVibeAmenities } from '@/hooks/useAmenities';
import { VIBES, getCollectionsForVibe, COLLECTION_MAPPINGS } from '../constants/vibeDefinitions';
// import { useFlightContext } from '../context/FlightContext';
import { getOptimalVibeOrder, shouldHighlightVibe, getVibeBadge, shouldAnimateReorder } from '../utils/getOptimalVibeOrder';
import { getBoardingStatus, getBoardingStatusColor, getBoardingStatusLabel, BoardingStatus } from '../utils/getBoardingStatus';

// Import Adaptive Luxe styles
import '../styles/adaptive-luxe.css';

// Enhanced CSS with glassmorphism
const enhancedStyles = `
  /* Import Adaptive Luxe variables */
  @import '../styles/adaptive-luxe.css';
  
  /* Scrollbar hiding */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Glass card styles */
  .glass-vibe-section {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }
  
  .glass-vibe-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.3) 50%, 
      transparent);
  }
  
  .glass-collection-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    transition: all 0.3s ease;
  }
  
  .glass-collection-card:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  /* Status banner glass effect */
  .glass-status-banner {
    background: linear-gradient(135deg, 
      rgba(102, 126, 234, 0.1) 0%, 
      rgba(118, 75, 162, 0.1) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  /* Pulse animations */
  @keyframes neonPulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.5),
                  inset 0 0 20px rgba(0, 255, 136, 0.1);
    }
    50% {
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.8),
                  inset 0 0 30px rgba(0, 255, 136, 0.2);
    }
  }
  
  @keyframes urgentPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 0, 110, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(255, 0, 110, 0);
    }
  }
  
  /* Vibe reordering animations */
  @keyframes slideAndGlow {
    0% {
      transform: translateY(30px);
      opacity: 0;
    }
    50% {
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    100% {
      transform: translateY(0);
      opacity: 1;
      box-shadow: none;
    }
  }
  
  .vibe-reorder-active {
    animation: slideAndGlow 0.7s ease-out;
  }
  
  /* Priority indicators */
  .priority-ring {
    position: absolute;
    inset: -2px;
    border-radius: 24px;
    background: linear-gradient(135deg, var(--luxe-purple), var(--luxe-pink));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  .priority-vibe .priority-ring {
    opacity: 1;
    animation: neonPulse 2s ease-in-out infinite;
  }
  
  /* Loading skeleton */
  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  .skeleton-loader {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 20px;
  }
  
  /* Dark theme background */
  .dark-gradient-bg {
    background: linear-gradient(180deg, #0A0E27 0%, #1a1a2e 100%);
    min-height: 100vh;
  }
`;

// Enhanced Badge Component
const EnhancedVibeBadge: React.FC<{
  vibeKey: string;
  boardingStatus: BoardingStatus | null;
  isTopRanked: boolean;
  timeToBoarding?: number;
  reason?: string;
}> = ({ vibeKey, boardingStatus, isTopRanked, timeToBoarding, reason }) => {
  const getBadgeConfig = () => {
    // Rush mode - urgent badges with neon effects
    if (boardingStatus === 'rush') {
      if (vibeKey === 'quick') {
        return {
          text: '⚡ Grab & Go',
          subtext: reason || 'Closest to gate',
          gradient: 'linear-gradient(135deg, #FF006E 0%, #FF4B2B 100%)',
          pulse: true,
          icon: <Zap className="w-3 h-3" />
        };
      }
    }
    
    // Extended delay - exploration badges
    if (boardingStatus === 'extended') {
      if (vibeKey === 'discover') {
        return {
          text: '✨ Explore Terminal',
          subtext: reason || `${Math.floor((timeToBoarding || 0) / 60)}h to discover`,
          gradient: 'linear-gradient(135deg, #00FF88 0%, #00B4D8 100%)',
          glow: true,
          icon: <Compass className="w-3 h-3" />
        };
      }
    }
    
    // Top ranked badge
    if (isTopRanked) {
      return {
        text: '🔥 Trending Now',
        subtext: reason || 'Popular with travelers',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        icon: <TrendingUp className="w-3 h-3" />
      };
    }
    
    return null;
  };
  
  const config = getBadgeConfig();
  if (!config) return null;
  
  return (
    <div className={`
      inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl
      text-white relative overflow-hidden
      ${config.pulse ? 'animate-pulse' : ''}
      ${config.glow ? 'shadow-lg shadow-green-500/30' : ''}
    `}
    style={{ background: config.gradient }}>
      <div className="flex items-center gap-1.5">
        {config.icon}
        <span className="text-xs font-bold">{config.text}</span>
      </div>
      {config.subtext && (
        <span className="text-[10px] opacity-90">{config.subtext}</span>
      )}
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite]">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
};

// Enhanced Status Banner with glassmorphism
const GlassStatusBanner: React.FC<{
  boardingStatus: BoardingStatus;
  timeToBoarding: number;
  gate?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
}> = ({ boardingStatus, timeToBoarding, gate, isDelayed, delayMinutes }) => {
  const getConfig = () => {
    const configs = {
      rush: {
        gradient: 'linear-gradient(135deg, #FF006E 0%, #FF4B2B 100%)',
        icon: <Timer className="w-5 h-5" />,
        title: 'Rush to Gate!',
        subtitle: `Only ${timeToBoarding} minutes left`,
        urgency: 'high'
      },
      imminent: {
        gradient: 'linear-gradient(135deg, #FFB700 0%, #FF6B00 100%)',
        icon: <Clock className="w-5 h-5" />,
        title: 'Boarding Soon',
        subtitle: 'Time for quick essentials',
        urgency: 'medium'
      },
      soon: {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        icon: <Coffee className="w-5 h-5" />,
        title: 'Relax & Recharge',
        subtitle: 'Perfect time for a meal',
        urgency: 'low'
      },
      normal: {
        gradient: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)',
        icon: <Briefcase className="w-5 h-5" />,
        title: 'Be Productive',
        subtitle: 'Make the most of your time',
        urgency: 'none'
      },
      extended: {
        gradient: 'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Extended Layover',
        subtitle: isDelayed ? `${delayMinutes}min delay` : 'Explore the terminal',
        urgency: 'none'
      }
    };
    
    return configs[boardingStatus] || configs.normal;
  };
  
  const config = getConfig();
  
  return (
    <div className={`
      glass-status-banner mx-4 mt-4 p-4 rounded-2xl
      ${config.urgency === 'high' ? 'animate-pulse' : ''}
      transition-all duration-500 hover:scale-[1.02]
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: config.gradient }}>
            {config.icon}
            <style>{`svg { color: white; }`}</style>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{config.title}</h3>
            <p className="text-white/70 text-sm">{config.subtitle}</p>
          </div>
        </div>
        
        <div className="text-right">
          {gate && (
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
              <p className="text-white/60 text-xs">Gate</p>
              <p className="text-white font-bold text-lg">{gate}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Navigation className="w-3 h-3 text-white/60" />
            <span className="text-white/60 text-xs">
              {Math.floor(timeToBoarding / 60)}h {timeToBoarding % 60}m
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ 
            width: `${Math.max(0, Math.min(100, (180 - timeToBoarding) / 180 * 100))}%`,
            background: config.gradient 
          }}
        />
      </div>
    </div>
  );
};

// Main Component
const VibesFeedMVPPhase3: React.FC = () => {
  const navigate = useNavigate();
  const [vibeSections, setVibeSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [terminal, setTerminal] = useState('SIN-T3');
  const [showTerminalSelector, setShowTerminalSelector] = useState(false);
  const [previousBoardingStatus, setPreviousBoardingStatus] = useState<BoardingStatus | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [previousVibeOrder, setPreviousVibeOrder] = useState<Record<string, number>>({});
  const [isReordering, setIsReordering] = useState(false);
  
  // Mock flight data for testing - replace with useFlightContext when available
  const mockBoardingTime = Date.now() + (120 * 60 * 1000); // 120 minutes from now
  const flightInfo = { 
    gate: 'A23', 
    isDelayed: false, 
    delayMinutes: 0 
  };
  const boardingTime = mockBoardingTime;
  const boardingStatus = getBoardingStatus(boardingTime) as BoardingStatus;
  
  // Get optimal vibe order
  const vibeOrderResult = useMemo(() => {
    return getOptimalVibeOrder(boardingTime);
  }, [boardingTime]);
  
  const vibeOrder = vibeOrderResult.order;
  
  // Check for reordering animation
  useEffect(() => {
    const hasOrderChanged = Object.keys(previousVibeOrder).length > 0 &&
      vibeOrder.some((vibe, index) => previousVibeOrder[vibe] !== index);
    
    if (hasOrderChanged) {
      setIsReordering(true);
      setShouldAnimate(true);
      
      setTimeout(() => {
        setIsReordering(false);
        setShouldAnimate(false);
      }, 700);
    }
    
    // Update previous order
    const newOrder: Record<string, number> = {};
    vibeOrder.forEach((vibe, index) => {
      newOrder[vibe] = index;
    });
    setPreviousVibeOrder(newOrder);
  }, [vibeOrder]);
  
  // Load vibe data
  useEffect(() => {
    const loadVibeData = async () => {
      setLoading(true);
      
      // Simulate loading with skeleton
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create vibe sections based on order
      const sections = vibeOrder.map((vibeKey, index) => {
        const vibeData = VIBES.find(v => v.slug === vibeKey);
        if (!vibeData) return null;
        
        return {
          vibe: vibeKey,
          name: vibeData.name,
          icon: vibeData.emoji,
          description: vibeData.subtitle,
          gradient: vibeData.gradient,
          collections: getCollectionsForVibe(vibeKey).slice(0, 4),
          order: index,
          highlighted: shouldHighlightVibe(vibeKey, boardingStatus || 'normal'),
          badge: getVibeBadge(vibeKey, boardingStatus || 'normal')?.text || '',
          previousOrder: previousVibeOrder[vibeKey]
        };
      }).filter(Boolean);
      
      setVibeSections(sections);
      setLoading(false);
    };
    
    loadVibeData();
  }, [vibeOrder, boardingStatus, boardingTime]);
  
  // Loading state with skeletons
  if (loading) {
    return (
      <div className="dark-gradient-bg p-4">
        <style dangerouslySetInnerHTML={{ __html: enhancedStyles }} />
        
        {/* Skeleton header */}
        <div className="skeleton-loader h-20 mb-4" />
        
        {/* Skeleton vibes */}
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-6">
            <div className="skeleton-loader h-32 mb-3" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="skeleton-loader h-40 w-32 flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="dark-gradient-bg min-h-screen pb-20">
      <style dangerouslySetInnerHTML={{ __html: enhancedStyles }} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--luxe-purple)] to-[var(--luxe-pink)] bg-clip-text text-transparent">
            Terminal+
          </h1>
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-white/70 text-sm">{terminal}</span>
          </div>
        </div>
      </header>
      
      {/* Status Banner */}
      {boardingStatus && boardingTime && (
        <GlassStatusBanner
          boardingStatus={boardingStatus}
          timeToBoarding={Math.floor((boardingTime - Date.now()) / 60000)}
          gate={flightInfo?.gate}
          isDelayed={flightInfo?.isDelayed}
          delayMinutes={flightInfo?.delayMinutes}
        />
      )}
      
      {/* Reordering Indicator */}
      {isReordering && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-card px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Optimizing for your schedule...
            </p>
          </div>
        </div>
      )}
      
      {/* Vibe Sections */}
      <div className="mt-6 space-y-6">
        {vibeSections.map((section, index) => (
          <div
            key={section.vibe}
            className={`
              glass-vibe-section mx-4 p-4 
              ${section.highlighted ? 'priority-vibe' : ''}
              ${shouldAnimate ? 'vibe-reorder-active' : ''}
              transition-all duration-700
            `}
            style={{
              animationDelay: `${index * 100}ms`,
              transform: shouldAnimate ? `translateY(${(section.previousOrder - index) * 20}px)` : 'none'
            }}
          >
            <div className="priority-ring" />
            
            {/* Vibe Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Rank indicator */}
                {index < 3 && (
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    font-bold text-sm text-white
                  `}
                  style={{
                    background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                               index === 1 ? 'linear-gradient(135deg, #C0C0C0, #808080)' :
                               'linear-gradient(135deg, #CD7F32, #8B4513)'
                  }}>
                    {index + 1}
                  </div>
                )}
                
                <span className="text-3xl">{section.icon}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{section.name}</h2>
                    {section.highlighted && (
                      <EnhancedVibeBadge
                        vibeKey={section.vibe}
                        boardingStatus={boardingStatus}
                        isTopRanked={index === 0}
                        timeToBoarding={boardingTime ? Math.floor((boardingTime - Date.now()) / 60000) : undefined}
                        reason={section.badge}
                      />
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{section.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate(`/collections/${section.vibe}`)}
                className="glass-card px-3 py-1.5 rounded-full text-white text-sm font-medium
                         hover:bg-white/20 transition-all duration-300"
              >
                See all
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
            
            {/* Collections Horizontal Scroll */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3">
                {section.collections.map((collection: any, colIndex: number) => (
                  <div
                    key={collection.collection_slug}
                    className="glass-collection-card min-w-[140px] p-3 cursor-pointer"
                    onClick={() => navigate(`/collection/${collection.collection_slug}`)}
                    style={{
                      animationDelay: `${(index * 4 + colIndex) * 50}ms`
                    }}
                  >
                    <div 
                      className="h-20 rounded-lg mb-2 flex items-center justify-center text-2xl"
                      style={{ background: section.gradient }}
                    >
                      {collection.icon || section.icon}
                    </div>
                    <h3 className="text-white font-semibold text-sm line-clamp-1">
                      {collection.collection_name}
                    </h3>
                    <p className="text-white/50 text-xs mt-0.5">
                      {collection.spots_total} spots
                    </p>
                    {collection.spots_near_you > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-[var(--luxe-lime)] rounded-full animate-pulse" />
                        <span className="text-[var(--luxe-lime)] text-xs">
                          {collection.spots_near_you} nearby
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VibesFeedMVPPhase3;
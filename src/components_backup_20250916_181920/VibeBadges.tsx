/**
 * VibeBadges Component
 * Visual indicators for vibe sections based on boarding status and context
 * Phase 3: Visual Enhancements for Terminal+ 
 */

import React from 'react';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Star, 
  AlertCircle, 
  Sparkles,
  Coffee,
  Briefcase,
  ShoppingBag,
  MapPin,
  Heart,
  Gauge
} from 'lucide-react';
import { BoardingStatus } from '../utils/getBoardingStatus';

interface VibeBadgeProps {
  vibeKey: string;
  boardingStatus: BoardingStatus | null;
  isTopRanked: boolean;
  timeToBoarding?: number;
  isDelayed?: boolean;
}

interface BadgeConfig {
  text: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor?: string;
  pulse?: boolean;
  glow?: boolean;
}

export const VibeBadge: React.FC<VibeBadgeProps> = ({ 
  vibeKey, 
  boardingStatus, 
  isTopRanked,
  timeToBoarding,
  isDelayed 
}) => {
  const getBadgeConfig = (): BadgeConfig | null => {
    // Rush mode badges - urgent styling
    if (boardingStatus === 'rush') {
      if (vibeKey === 'quick') {
        return {
          text: 'Grab & Go',
          icon: <Zap className="w-3 h-3" />,
          bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
          textColor: 'text-white',
          pulse: true,
          glow: true
        };
      }
      if (vibeKey === 'refuel' && isTopRanked) {
        return {
          text: 'Fast Food',
          icon: <Gauge className="w-3 h-3" />,
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          pulse: true
        };
      }
    }
    
    // Imminent badges - moderate urgency
    if (boardingStatus === 'imminent') {
      if (vibeKey === 'refuel') {
        return {
          text: 'Quick Bite',
          icon: <Coffee className="w-3 h-3" />,
          bgColor: 'bg-amber-500',
          textColor: 'text-white'
        };
      }
      if (vibeKey === 'quick') {
        return {
          text: `${timeToBoarding} min left`,
          icon: <Clock className="w-3 h-3" />,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-300'
        };
      }
    }
    
    // Soon badges - relaxed recommendations
    if (boardingStatus === 'soon') {
      if (vibeKey === 'comfort') {
        return {
          text: 'Relax Time',
          icon: <Heart className="w-3 h-3" />,
          bgColor: 'bg-purple-500',
          textColor: 'text-white'
        };
      }
      if (vibeKey === 'refuel' && isTopRanked) {
        return {
          text: 'Dine In',
          icon: <Star className="w-3 h-3" />,
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
      }
    }
    
    // Normal badges - productivity focus
    if (boardingStatus === 'normal') {
      if (vibeKey === 'work') {
        return {
          text: 'Be Productive',
          icon: <Briefcase className="w-3 h-3" />,
          bgColor: 'bg-gray-700',
          textColor: 'text-white'
        };
      }
      if (vibeKey === 'comfort' && isTopRanked) {
        return {
          text: 'Lounge Access',
          icon: <Sparkles className="w-3 h-3" />,
          bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
          textColor: 'text-white',
          glow: true
        };
      }
    }
    
    // Extended delay badges - exploration
    if (boardingStatus === 'extended') {
      if (vibeKey === 'discover') {
        return {
          text: `${Math.floor((timeToBoarding || 0) / 60)}h+ to explore`,
          icon: <MapPin className="w-3 h-3" />,
          bgColor: 'bg-gradient-to-r from-green-500 to-teal-500',
          textColor: 'text-white',
          glow: true
        };
      }
      if (vibeKey === 'shop') {
        return {
          text: 'Duty Free Time',
          icon: <ShoppingBag className="w-3 h-3" />,
          bgColor: 'bg-pink-500',
          textColor: 'text-white'
        };
      }
    }
    
    // Generic top-ranked badge
    if (isTopRanked && !boardingStatus) {
      return {
        text: 'Popular Now',
        icon: <TrendingUp className="w-3 h-3" />,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300'
      };
    }
    
    return null;
  };
  
  const config = getBadgeConfig();
  
  if (!config) return null;
  
  return (
    <div className="relative">
      <div className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
        ${config.bgColor} ${config.textColor} 
        ${config.borderColor ? `border ${config.borderColor}` : ''}
        ${config.pulse ? 'animate-pulse' : ''}
        ${config.glow ? 'shadow-lg' : 'shadow-sm'}
        transition-all duration-300 hover:scale-105
      `}>
        {config.icon}
        <span>{config.text}</span>
      </div>
      
      {/* Glow effect for special badges */}
      {config.glow && (
        <div className={`
          absolute inset-0 rounded-full ${config.bgColor} 
          opacity-30 blur-xl animate-pulse -z-10
        `} />
      )}
    </div>
  );
};

interface StatusBannerProps {
  boardingStatus: BoardingStatus;
  timeToBoarding: number;
  gate?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  boardingStatus,
  timeToBoarding,
  gate,
  isDelayed,
  delayMinutes
}) => {
  const getBannerConfig = () => {
    const baseClasses = "mx-4 mt-4 p-4 rounded-xl flex items-center justify-between transition-all duration-500";
    
    switch (boardingStatus) {
      case 'rush':
        return {
          className: `${baseClasses} bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200`,
          icon: <Zap className="w-5 h-5 text-red-500" />,
          title: '⚡ Rush to Gate!',
          subtitle: `Only ${timeToBoarding} minutes to boarding`,
          iconBg: 'bg-red-100'
        };
      
      case 'imminent':
        return {
          className: `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200`,
          icon: <Clock className="w-5 h-5 text-amber-500" />,
          title: '⏰ Boarding Soon',
          subtitle: 'Time for a quick bite or last-minute essentials',
          iconBg: 'bg-amber-100'
        };
      
      case 'soon':
        return {
          className: `${baseClasses} bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200`,
          icon: <Coffee className="w-5 h-5 text-blue-500" />,
          title: '😌 Relax & Recharge',
          subtitle: 'Perfect time to grab a meal or visit a lounge',
          iconBg: 'bg-blue-100'
        };
      
      case 'normal':
        return {
          className: `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200`,
          icon: <Briefcase className="w-5 h-5 text-green-600" />,
          title: '💼 Make It Productive',
          subtitle: 'Plenty of time to work, shop, or explore',
          iconBg: 'bg-green-100'
        };
      
      case 'extended':
        return {
          className: `${baseClasses} bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200`,
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          title: '✨ Extended Layover',
          subtitle: isDelayed ? `${delayMinutes} min delay - explore the terminal!` : 'Turn wait time into adventure time',
          iconBg: 'bg-purple-100'
        };
      
      default:
        return null;
    }
  };
  
  const config = getBannerConfig();
  
  if (!config) return null;
  
  return (
    <div className={config.className}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${config.iconBg}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-600">{config.subtitle}</p>
        </div>
      </div>
      
      <div className="text-right">
        {gate && (
          <>
            <p className="text-xs text-gray-500">Gate</p>
            <p className="text-lg font-bold text-gray-900">{gate}</p>
          </>
        )}
        {boardingStatus !== 'extended' && (
          <p className="text-xs text-gray-500 mt-1">
            {Math.floor(timeToBoarding / 60)}h {timeToBoarding % 60}m
          </p>
        )}
        {isDelayed && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span className="text-xs text-amber-600">Delayed</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface VibeHeaderProps {
  vibeKey: string;
  vibeName: string;
  vibeIcon: string;
  vibeDescription: string;
  isHighlighted: boolean;
  rank: number;
  boardingStatus: BoardingStatus | null;
  onSeeAll: () => void;
}

export const VibeHeader: React.FC<VibeHeaderProps> = ({
  vibeKey,
  vibeName,
  vibeIcon,
  vibeDescription,
  isHighlighted,
  rank,
  boardingStatus,
  onSeeAll
}) => {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Rank indicator for top 3 vibes */}
          {rank <= 3 && (
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                'bg-gradient-to-br from-orange-400 to-orange-500 text-white'}
              shadow-md
            `}>
              {rank}
            </div>
          )}
          
          <div className="relative">
            <span className="text-3xl filter drop-shadow-sm">{vibeIcon}</span>
            {isHighlighted && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{vibeName}</h2>
              <VibeBadge 
                vibeKey={vibeKey}
                boardingStatus={boardingStatus}
                isTopRanked={rank <= 2}
                timeToBoarding={0} // Pass actual value from parent
              />
            </div>
            <p className="text-sm text-gray-600">{vibeDescription}</p>
          </div>
        </div>
        
        <button 
          onClick={onSeeAll}
          className={`
            text-sm font-semibold flex items-center gap-1 px-3 py-1.5 
            rounded-full backdrop-blur-sm shadow-sm hover:shadow-md 
            transition-all duration-300 hover:scale-105
            ${isHighlighted 
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
              : 'bg-white/80 text-gray-700 hover:bg-white'}
          `}
        >
          See all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Export animation styles for use in parent components
export const vibeAnimationStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  .vibe-reorder-enter {
    animation: slideDown 0.5s ease-out forwards;
  }
  
  .vibe-highlight-enter {
    animation: fadeInScale 0.3s ease-out forwards;
  }
  
  .vibe-shimmer {
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 60%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
`;
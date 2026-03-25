/**
 * VibeTransitions Component
 * Animated transitions and visual feedback for vibe reordering
 * Phase 3: Visual Enhancements for Terminal+
 */

import React, { useEffect, useState, useRef } from 'react';
import { BoardingStatus } from '../utils/getBoardingStatus';

interface TransitionConfig {
  duration: number;
  delay: number;
  easing: string;
  scale?: number;
  rotate?: number;
  opacity?: number;
}

interface VibeTransitionProps {
  children: React.ReactNode;
  vibeKey: string;
  order: number;
  previousOrder?: number;
  isHighlighted: boolean;
  boardingStatus: BoardingStatus | null;
  shouldAnimate: boolean;
}

export const VibeTransition: React.FC<VibeTransitionProps> = ({
  children,
  vibeKey,
  order,
  previousOrder,
  isHighlighted,
  boardingStatus,
  shouldAnimate
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Calculate transition based on order change
  useEffect(() => {
    if (!shouldAnimate || previousOrder === undefined) return;
    
    const orderDiff = order - previousOrder;
    
    if (orderDiff !== 0) {
      setIsAnimating(true);
      
      // Different animations based on movement direction
      if (orderDiff < 0) {
        // Moving up - more prominent animation
        setTransitionClass('vibe-move-up');
      } else {
        // Moving down - subtle animation
        setTransitionClass('vibe-move-down');
      }
      
      // Reset animation after completion
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTransitionClass('');
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [order, previousOrder, shouldAnimate]);
  
  // Highlight animation for priority vibes
  useEffect(() => {
    if (isHighlighted && !isAnimating) {
      setTransitionClass('vibe-highlight-pulse');
    } else if (!isHighlighted && transitionClass === 'vibe-highlight-pulse') {
      setTransitionClass('');
    }
  }, [isHighlighted, isAnimating]);
  
  return (
    <div
      ref={elementRef}
      className={`
        relative transition-all duration-500 ease-in-out
        ${transitionClass}
        ${isAnimating ? 'z-10' : 'z-0'}
      `}
      style={{
        transitionDelay: `${order * 50}ms`
      }}
    >
      {/* Animated background glow for highlighted vibes */}
      {isHighlighted && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 opacity-30 blur-xl animate-pulse" />
        </div>
      )}
      
      {children}
    </div>
  );
};

interface StatusTransitionProps {
  currentStatus: BoardingStatus | null;
  previousStatus: BoardingStatus | null;
  children: React.ReactNode;
}

export const StatusTransition: React.FC<StatusTransitionProps> = ({
  currentStatus,
  previousStatus,
  children
}) => {
  const [showTransition, setShowTransition] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  
  useEffect(() => {
    if (previousStatus && currentStatus && previousStatus !== currentStatus) {
      // Show transition notification
      setShowTransition(true);
      setTransitionText(getTransitionMessage(previousStatus, currentStatus));
      
      // Hide after animation
      const timer = setTimeout(() => {
        setShowTransition(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStatus, previousStatus]);
  
  const getTransitionMessage = (from: BoardingStatus, to: BoardingStatus): string => {
    const transitions: Record<string, string> = {
      'normal-soon': '⏰ Time to start heading to your gate soon',
      'soon-imminent': '🍔 Last chance for a quick bite!',
      'imminent-rush': '⚡ Time to rush! Head to gate now!',
      'rush-imminent': '😅 Good, you have a bit more time',
      'imminent-soon': '😌 Relax, you have more time than expected',
      'soon-normal': '💼 Plenty of time now, be productive!',
      'normal-extended': '✨ Flight delayed - time to explore!',
    };
    
    const key = `${from}-${to}`;
    return transitions[key] || `Status changed to ${to}`;
  };
  
  return (
    <div className="relative">
      {/* Transition notification overlay */}
      {showTransition && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
            <p className="font-semibold text-sm">{transitionText}</p>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

interface ReorderIndicatorProps {
  vibeKey: string;
  fromPosition: number;
  toPosition: number;
  isVisible: boolean;
}

export const ReorderIndicator: React.FC<ReorderIndicatorProps> = ({
  vibeKey,
  fromPosition,
  toPosition,
  isVisible
}) => {
  if (!isVisible) return null;
  
  const movement = toPosition - fromPosition;
  const isMovingUp = movement < 0;
  
  return (
    <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
      <div className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
        ${isMovingUp ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
        animate-pulse
      `}>
        {isMovingUp ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        <span>{Math.abs(movement)}</span>
      </div>
    </div>
  );
};

// CSS for animations
export const transitionStyles = `
  @keyframes moveUp {
    0% {
      transform: translateY(0);
      opacity: 0.7;
    }
    50% {
      transform: translateY(-10px);
      opacity: 1;
      background-color: rgba(147, 51, 234, 0.1);
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes moveDown {
    0% {
      transform: translateY(0);
      opacity: 0.7;
    }
    50% {
      transform: translateY(10px);
      opacity: 0.9;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes highlightPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
    }
    50% {
      transform: scale(1.01);
      box-shadow: 0 0 20px 5px rgba(147, 51, 234, 0.3);
    }
  }
  
  @keyframes slideInFromTop {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .vibe-move-up {
    animation: moveUp 0.6s ease-out forwards;
  }
  
  .vibe-move-down {
    animation: moveDown 0.6s ease-out forwards;
  }
  
  .vibe-highlight-pulse {
    animation: highlightPulse 2s ease-in-out infinite;
  }
  
  .vibe-enter {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  .status-change-notification {
    animation: slideInFromTop 0.5s ease-out forwards;
  }
`;

interface CollectionCardTransitionProps {
  children: React.ReactNode;
  index: number;
  isUrgent: boolean;
}

export const CollectionCardTransition: React.FC<CollectionCardTransitionProps> = ({
  children,
  index,
  isUrgent
}) => {
  return (
    <div
      className={`
        transform transition-all duration-300 hover:scale-105
        ${isUrgent ? 'hover:shadow-2xl' : 'hover:shadow-lg'}
      `}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.5s ease-out forwards'
      }}
    >
      {children}
    </div>
  );
};

interface PriorityPulseProps {
  isActive: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityPulse: React.FC<PriorityPulseProps> = ({
  isActive,
  color = 'purple',
  size = 'md'
}) => {
  if (!isActive) return null;
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const colorClasses = {
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500'
  };
  
  return (
    <div className="absolute -top-1 -right-1">
      <span className={`
        absolute inline-flex h-full w-full rounded-full 
        ${colorClasses[color as keyof typeof colorClasses]} 
        opacity-75 animate-ping
      `} />
      <span className={`
        relative inline-flex rounded-full 
        ${sizeClasses[size]} 
        ${colorClasses[color as keyof typeof colorClasses]}
      `} />
    </div>
  );
};
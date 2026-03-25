// Adaptive Luxe Component Library
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import '../styles/adaptive-luxe.css';

// ===== Live Status Components =====

export const LiveDot = ({ 
  status = 'success', 
  size = 'small' 
}: { 
  status?: 'success' | 'warning' | 'danger'; 
  size?: 'small' | 'large' 
}) => {
  const colorMap = {
    success: 'bg-[#00FF88]',
    warning: 'bg-[#FFD700]',
    danger: 'bg-[#FF006E]',
  };
  
  const sizeMap = {
    small: 'h-2 w-2',
    large: 'h-3 w-3'
  };
  
  return (
    <span className={`relative inline-flex ${sizeMap[size]}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeMap[size]} ${colorMap[status]}`} />
    </span>
  );
};

export const LiveBadge = ({ 
  children, 
  status = 'success' 
}: { 
  children: ReactNode; 
  status?: 'success' | 'warning' | 'danger' 
}) => {
  const colorMap = {
    success: 'bg-[#00FF88]/20 border-[#00FF88]/40 text-[#00FF88]',
    warning: 'bg-[#FFD700]/20 border-[#FFD700]/40 text-[#FFD700]',
    danger: 'bg-[#FF006E]/20 border-[#FF006E]/40 text-[#FF006E]',
  };
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${colorMap[status]}`}>
      <LiveDot status={status} size="small" />
      {children}
    </span>
  );
};

// ===== Glass Card Components =====

export const GlassCard = ({ 
  children, 
  className = '',
  hover = true,
  onClick 
}: { 
  children: ReactNode; 
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) => {
  const handleClick = () => {
    if (onClick) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick();
    }
  };
  
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      onClick={handleClick}
      className={`glass-card ${hover ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const GlassCardHeavy = ({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) => {
  return (
    <div className={`glass-card-heavy ${className}`}>
      {children}
    </div>
  );
};

// ===== Mini Map Component =====

export const MiniMap = ({ 
  distance = '3 min',
  showPath = true 
}: { 
  distance?: string;
  showPath?: boolean;
}) => {
  return (
    <div className="mini-map">
      {showPath && (
        <>
          <div className="mini-map-path" />
          <div className="mini-map-dot start" />
          <div className="mini-map-dot end" />
        </>
      )}
      <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs font-semibold">
        {distance}
      </div>
    </div>
  );
};

// ===== Chip Components =====

export const Chip = ({ 
  children, 
  variant = 'default',
  icon,
  onClick
}: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
  onClick?: () => void;
}) => {
  const variantMap = {
    default: 'luxe-chip',
    success: 'luxe-chip luxe-chip-success',
    warning: 'luxe-chip luxe-chip-warning',
    danger: 'luxe-chip luxe-chip-danger',
  };
  
  return (
    <span 
      className={`${variantMap[variant]} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};

// ===== Gradient Text =====

export const GradientText = ({ 
  children, 
  variant = 'primary',
  className = ''
}: { 
  children: ReactNode; 
  variant?: 'primary' | 'neon';
  className?: string;
}) => {
  return (
    <span className={`${variant === 'neon' ? 'gradient-text-neon' : 'gradient-text'} ${className}`}>
      {children}
    </span>
  );
};

// ===== Loading Skeleton =====

export const Skeleton = ({ 
  className = '',
  height = 'h-4',
  width = 'w-full'
}: { 
  className?: string;
  height?: string;
  width?: string;
}) => {
  return (
    <div className={`skeleton rounded-lg ${height} ${width} ${className}`} />
  );
};

// ===== Page Transitions =====

export const PageTransition = ({ 
  children 
}: { 
  children: ReactNode 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// ===== Floating Action Button =====

export const FAB = ({ 
  icon, 
  onClick,
  className = ''
}: { 
  icon: ReactNode; 
  onClick: () => void;
  className?: string;
}) => {
  const handleClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };
  
  return (
    <button 
      className={`fab ${className}`}
      onClick={handleClick}
    >
      {icon}
    </button>
  );
};

// ===== Time Badge =====

export const TimeBadge = () => {
  const getTimeInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { icon: '🌅', label: 'Morning Mode' };
    if (hour >= 12 && hour < 20) return { icon: '☀️', label: 'Day Mode' };
    return { icon: '🌙', label: 'Night Mode' };
  };
  
  const timeInfo = getTimeInfo();
  
  return (
    <div className="fixed top-4 right-4 z-50 glass-card px-4 py-2 text-xs text-white/70">
      {timeInfo.icon} {timeInfo.label}
    </div>
  );
};

// ===== Hero Section =====

export const HeroSection = ({ 
  gradient,
  emoji,
  title,
  subtitle,
  stats = []
}: { 
  gradient?: string;
  emoji: string;
  title: string;
  subtitle: string;
  stats?: Array<{ label: string; value: string | number; live?: boolean }>;
}) => {
  return (
    <div className="relative h-[60vh] overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{ background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27]/80 to-transparent" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-8 left-6 right-6"
      >
        <GlassCardHeavy className="p-6 rounded-[28px]">
          <motion.div 
            className="text-5xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {emoji}
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/80 mb-4">{subtitle}</p>
          
          {stats.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {stats.map((stat, index) => (
                <Chip key={index} variant={stat.live ? 'success' : 'default'}>
                  {stat.live && <LiveDot status="success" />}
                  {stat.label}: {stat.value}
                </Chip>
              ))}
            </div>
          )}
        </GlassCardHeavy>
      </motion.div>
    </div>
  );
};

// ===== Gradient Border Card =====

export const GradientBorderCard = ({ 
  children,
  className = ''
}: { 
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`gradient-border ${className}`}>
      {children}
    </div>
  );
};

// ===== Pull to Refresh =====

export const PullToRefresh = ({ 
  onRefresh,
  children
}: { 
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Add pull-to-refresh logic here
  
  return (
    <div ref={containerRef} className="relative">
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00FF88]" />
        </div>
      )}
      {children}
    </div>
  );
};

// ===== Export all components =====

export const AdaptiveLuxe = {
  LiveDot,
  LiveBadge,
  GlassCard,
  GlassCardHeavy,
  MiniMap,
  Chip,
  GradientText,
  Skeleton,
  PageTransition,
  FAB,
  TimeBadge,
  HeroSection,
  GradientBorderCard,
  PullToRefresh,
};

export default AdaptiveLuxe;

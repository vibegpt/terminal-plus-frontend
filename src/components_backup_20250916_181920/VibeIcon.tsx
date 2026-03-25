import React from 'react';

interface VibeIconProps {
  vibe: string;
  className?: string;
}

const VIBE_ICONS: Record<string, string> = {
  Chill: '😌',
  Explore: '🔍',
  Work: '💼',
  Quick: '⚡',
  Refuel: '🍔',
  Comfort: '🛋️',
  Shop: '🛍️',
};

export const VibeIcon: React.FC<VibeIconProps> = ({ vibe, className = '' }) => {
  const icon = VIBE_ICONS[vibe] || '📍';
  
  return (
    <span className={className}>
      {icon}
    </span>
  );
}; 
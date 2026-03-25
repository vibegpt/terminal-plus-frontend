import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Heart, Trash2, Bookmark } from 'lucide-react';

interface SwipeableVibeCardProps {
  amenity: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    price_level?: string;
    primary_vibe: string;
  };
  onBookmark?: (amenity: any) => void;
  onDelete?: (amenity: any) => void;
  onTap?: (amenity: any) => void;
  className?: string;
}

export function SwipeableVibeCard({ 
  amenity, 
  onBookmark, 
  onDelete, 
  onTap,
  className = '' 
}: SwipeableVibeCardProps) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (event: any, info: any) => {
    const { offset } = info;
    if (offset.x > 20) {
      setDragDirection('right');
    } else if (offset.x < -20) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 0.5;
    
    const isSwipe = Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold;
    
    if (isSwipe) {
      if (offset.x > 0 && onBookmark) {
        // Swiped right - bookmark
        onBookmark(amenity);
        controls.start({ 
          x: 300, 
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.3 }
        });
      } else if (offset.x < 0 && onDelete) {
        // Swiped left - delete
        onDelete(amenity);
        controls.start({ 
          x: -300, 
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.3 }
        });
      }
    } else {
      // Snap back
      controls.start({ 
        x: 0, 
        scale: 1,
        transition: { duration: 0.2 }
      });
    }
    
    setIsDragging(false);
    setDragDirection(null);
  };

  const handleTap = () => {
    if (!isDragging && onTap) {
      onTap(amenity);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={controls}
      className={`swipeable-card ${className} ${isDragging ? 'swiping' : ''}`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Swipe indicators */}
      <div className="swipe-indicator left">
        <Heart className="w-6 h-6" />
        <span className="ml-1">Save</span>
      </div>
      <div className="swipe-indicator right">
        <Trash2 className="w-6 h-6" />
        <span className="ml-1">Remove</span>
      </div>
      
      {/* Card content */}
      <div 
        className={`bg-white p-4 rounded-lg ${isDragging ? 'opacity-80' : ''}`}
        onClick={handleTap}
      >
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {amenity.logo_url ? (
              <img 
                src={amenity.logo_url} 
                alt={amenity.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {amenity.name}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
              {amenity.description}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {amenity.primary_vibe}
              </span>
              {amenity.price_level && (
                <span className="text-xs font-medium text-green-600">
                  {amenity.price_level}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons for non-swipe interactions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(amenity);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <Bookmark className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(amenity);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default SwipeableVibeCard;

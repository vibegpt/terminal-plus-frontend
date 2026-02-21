import React from 'react';
import { getAmenityContext } from '../utils/amenityContexts';
import { isHiddenGemsFreeAmenity } from '../config/hiddenGemsFreeAmenities';

interface AmenityCardProps {
  amenity: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price_level?: string;
    location?: string;
    category?: string;
    vibe_tags?: string[];
    slug?: string;
    amenity_slug?: string;
    // Enhanced properties from useCollectionAmenities
    contextInfo?: any;
    displayName?: string;
    displayDescription?: string;
    contextBadge?: string;
    emphasisTags?: string[];
    callToAction?: string;
    price_tier?: string; // Added for new logic
  };
  collectionSlug: string;
  terminalCode?: string; // Add terminal code for location-aware display
  onAmenityClick?: (amenityId: string) => void;
  showContext?: boolean;
  showTerminalHighlight?: boolean;
  className?: string;
}

const ContextAwareAmenityCard: React.FC<AmenityCardProps> = ({
  amenity,
  collectionSlug,
  terminalCode,
  onAmenityClick,
  showContext = true,
  showTerminalHighlight = true,
  className = ''
}) => {
  // Get the contextual information for this amenity in this collection
  const context = getAmenityContext(amenity.id, collectionSlug);
  
  // If no specific context found, use the base amenity data
  const displayName = amenity.name;
  const displayDescription = amenity.description || '';
  const displayIcon = '✨';
  const displayGradient = 'from-gray-500 to-gray-600';
  const callToAction = 'Learn more';
  
  const handleClick = () => {
    if (onAmenityClick) {
      onAmenityClick(amenity.id);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* Context Badge */}
      {showContext && context && (
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${displayGradient}`}>
          {context.context}
        </div>
      )}
      
      {/* Terminal Highlight Badge */}
      {showTerminalHighlight && terminalCode && (
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
          Terminal {terminalCode}
        </div>
      )}
      
      {/* Image or Placeholder */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative">
        {amenity.image_url ? (
          <img 
            src={amenity.image_url} 
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${displayGradient} flex items-center justify-center`}>
            <span className="text-4xl">{displayIcon}</span>
          </div>
        )}
        
        {/* Price Level Badge */}
        {(() => {
          const amenitySlug = amenity.id || amenity.slug || amenity.amenity_slug;
          const price = amenity.price_tier || amenity.price_level;
          
          // Check if this is a Hidden Gems collection
          const isHiddenGemsCollection = collectionSlug === 'hidden-gems';
          
          // For Hidden Gems collection, check if it's a free amenity
          if (isHiddenGemsCollection && isHiddenGemsFreeAmenity(amenitySlug)) {
            return (
              <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full font-medium">
                Free
              </div>
            );
          }
          
          // Free amenities - no dollar sign
          if (!price || price === '' || price.toLowerCase() === 'free') {
            return (
              <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full font-medium">
                Free
              </div>
            );
          }
          
          // Paid amenities - show with dollar signs
          return (
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
              <span>$</span>
              <span>{price}</span>
            </div>
          );
        })()}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Amenity Name */}
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {displayName}
        </h3>
        
        {/* Contextual Description */}
        {displayDescription && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {displayDescription}
          </p>
        )}
        
        {/* Terminal-Specific Description */}
        {/* isTerminalHighlight and terminalContext are not defined in this component's scope */}
        {/* This block will cause a linter error if uncommented */}
        {/* {isTerminalHighlight && terminalContext?.terminalSpecific?.localDescription && (
          <div className="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 rounded-r-lg">
            <p className="text-sm text-orange-800 font-medium">
              {terminalContext.terminalSpecific.localDescription}
            </p>
          </div>
        )} */}
        
        {/* Emphasis Tags */}
        {context?.emphasis && context.emphasis.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {context.emphasis.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          {/* Location */}
          {amenity.location && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              📍 {amenity.location}
            </div>
          )}
          
          {/* Call to Action */}
          <button 
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r ${displayGradient} hover:opacity-90 transition-opacity`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {callToAction}
          </button>
        </div>
      </div>
      
      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
    </div>
  );
};

export default ContextAwareAmenityCard;

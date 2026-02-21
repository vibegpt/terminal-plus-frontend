// Enhanced Amenity Card with automatic Google Places photos
import React from 'react';
import { Clock, Navigation, DollarSign, Star } from 'lucide-react';
import { useAmenityPhoto } from '../hooks/useAmenityPhotos';
import type { Amenity } from '../types/amenity.types';

interface EnhancedAmenityCardProps {
  amenity: Amenity;
  userTerminal?: string;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  className?: string;
}

export const EnhancedAmenityCard: React.FC<EnhancedAmenityCardProps> = ({ 
  amenity, 
  userTerminal = 'SYD-T1',
  onSave,
  isSaved = false,
  className = ''
}) => {
  // Automatically load photo from Google Places if not available
  const { photoUrl, isLoading: photoLoading } = useAmenityPhoto(amenity);
  
  const isInUserTerminal = amenity.terminal_code === userTerminal;
  
  const formatTerminal = (terminalCode: string) => {
    const parts = terminalCode.split('-');
    if (parts.length === 2 && parts[1].startsWith('T')) {
      return `Terminal ${parts[1].substring(1)}`;
    }
    return terminalCode;
  };

  return (
    <div className={`relative group cursor-pointer bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}>
      {/* Photo Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={amenity.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : photoLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📸</div>
              <div className="text-sm">Photo loading...</div>
            </div>
          </div>
        )}
        
        {/* Terminal Match Badge */}
        {isInUserTerminal && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <span>✓</span>
            <span>Your Terminal</span>
          </div>
        )}
        
        {/* Save Button */}
        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(amenity.id);
            }}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors duration-200"
          >
            <Star 
              className={`h-4 w-4 ${isSaved ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} 
            />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {amenity.name}
          </h3>
          {amenity.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium text-gray-700">{amenity.rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {amenity.description || `${amenity.category} in ${formatTerminal(amenity.terminal_code || userTerminal)}`}
        </p>
        
        {/* Details Row */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {amenity.terminal_code && (
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                <span>{formatTerminal(amenity.terminal_code)}</span>
              </div>
            )}
            
            {amenity.price_tier && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{amenity.price_tier}</span>
              </div>
            )}
          </div>
          
          {amenity.walkTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{amenity.walkTime}m walk</span>
            </div>
          )}
        </div>
        
        {/* Vibe Tags */}
        {amenity.vibe_tags && amenity.vibe_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {amenity.vibe_tags.slice(0, 2).map((vibe: string) => (
              <span 
                key={vibe}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {vibe}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
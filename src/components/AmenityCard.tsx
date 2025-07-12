import React from 'react';
import type { AmenityCardProps } from '../types/component.types';
import { Button } from './ui/button';
import { StarIcon, MapPinIcon, ClockIcon } from 'lucide-react';

export const AmenityCard: React.FC<AmenityCardProps> = ({
  amenity,
  onSelect,
  variant = 'default',
  showTerminal = false,
  className = ''
}) => {
  const handleSelect = () => {
    onSelect?.(amenity);
  };

  const getPriceRangeDisplay = (priceRange?: string) => {
    switch (priceRange) {
      case 'budget': return '$';
      case 'moderate': return '$$';
      case 'premium': return '$$$';
      default: return '';
    }
  };

  // Helper to get displayable hours
  const getDisplayHours = (hours: any): string => {
    if (!hours) return 'Hours not available';
    if (typeof hours === 'string') return hours;
    if (typeof hours === 'object') {
      const now = new Date();
      const day = now.toLocaleString('en-US', { weekday: 'long' });
      return hours[day] || hours['Monday-Sunday'] || 'Hours not available';
    }
    return 'Hours not available';
  };

  const baseClasses = 'bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow';
  const variantClasses = {
    default: 'p-6',
    compact: 'p-4',
    detailed: 'p-6'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {amenity.name}
          </h3>
          <p className="text-sm text-gray-500">
            {amenity.category}
            {amenity.subcategory && ` • ${amenity.subcategory}`}
          </p>
        </div>
        {amenity.priceRange && (
          <span className="text-sm font-medium text-gray-600">
            {getPriceRangeDisplay(amenity.priceRange)}
          </span>
        )}
      </div>
      {/* Location Info */}
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <MapPinIcon className="w-4 h-4 mr-1" />
        <span>{amenity.location}</span>
        {showTerminal && amenity.terminal && (
          <>
            <span className="mx-2">•</span>
            <span>Terminal {amenity.terminal}</span>
          </>
        )}
      </div>
      {/* Hours */}
      {amenity.hours && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <ClockIcon className="w-4 h-4 mr-1" />
          <span>{getDisplayHours(amenity.hours)}</span>
        </div>
      )}
      {/* Rating */}
      {amenity.rating && (
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(amenity.rating ?? 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {amenity.rating.toFixed(1)}
          </span>
        </div>
      )}
      {/* Description */}
      {variant === 'detailed' && amenity.description && (
        <p className="text-sm text-gray-600 mb-4">
          {amenity.description}
        </p>
      )}
      {/* Tags */}
      {amenity.tags && amenity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {amenity.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {amenity.tags.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs text-gray-500">
              +{amenity.tags.length - 3} more
            </span>
          )}
        </div>
      )}
      {/* Accessibility Badge */}
      {amenity.accessibility && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            ♿ Accessible
          </span>
        </div>
      )}
      {/* Action Button */}
      {onSelect && (
        <Button
          onClick={handleSelect}
          size="sm"
          variant="outline"
          className="w-full"
        >
          View Details
        </Button>
      )}
    </div>
  );
}; 
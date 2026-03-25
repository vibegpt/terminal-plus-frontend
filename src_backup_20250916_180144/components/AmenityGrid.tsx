import React from 'react';
import type { AmenityLocation } from '../types/amenity.types';
import { AmenityCard } from './AmenityCard';
import { LoadingSpinner } from './ui/loading-spinner';
import { ErrorMessage } from './ui/error-message';
import { FileX } from 'lucide-react';

interface AmenityGridProps {
  amenities: AmenityLocation[];
  loading: boolean;
  error: string | null;
  onAmenitySelect?: (amenity: AmenityLocation) => void;
  className?: string;
}

export const AmenityGrid: React.FC<AmenityGridProps> = ({
  amenities,
  loading,
  error,
  onAmenitySelect,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        action={{
          label: 'Try Again',
          onClick: () => window.location.reload()
        }}
      />
    );
  }
  if (amenities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <FileX className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No amenities found
        </h3>
        <p className="text-gray-500">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {amenities.map((amenity) => (
        <AmenityCard
          key={amenity.id}
          amenity={amenity}
          onSelect={onAmenitySelect}
          showTerminal={true}
        />
      ))}
    </div>
  );
}; 
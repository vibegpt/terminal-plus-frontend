import React from 'react';
import ContextAwareAmenityCard from './ContextAwareAmenityCard';
import { 
  getTerminalHighlightsForCollection, 
  getTerminalSpecificAmenities,
  isTerminalHighlight 
} from '../utils/amenityContexts';

interface TerminalAwareCollectionProps {
  collectionSlug: string;
  terminalCode: string;
  amenities: any[];
  title?: string;
  description?: string;
  onAmenityClick?: (amenityId: string) => void;
  showTerminalHighlights?: boolean;
}

const TerminalAwareCollection: React.FC<TerminalAwareCollectionProps> = ({
  collectionSlug,
  terminalCode,
  amenities,
  title,
  description,
  onAmenityClick,
  showTerminalHighlights = true
}) => {
  // Get terminal-specific highlights for this collection
  const terminalHighlights = getTerminalHighlightsForCollection(collectionSlug, terminalCode);
  
  // Separate terminal highlights from regular amenities
  const highlightedAmenities = amenities.filter(amenity => 
    isTerminalHighlight(amenity.id, terminalCode)
  );
  
  const regularAmenities = amenities.filter(amenity => 
    !isTerminalHighlight(amenity.id, terminalCode)
  );

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title || collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </h2>
        {description && (
          <p className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        
        {/* Terminal-Specific Info */}
        {terminalHighlights.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              🌟 {terminalCode} Highlights
            </h3>
            <p className="text-blue-700 text-sm">
              Discover what makes {terminalCode} special with these unique attractions
            </p>
          </div>
        )}
      </div>

      {/* Terminal Highlights Section */}
      {showTerminalHighlights && highlightedAmenities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            🎯 {terminalCode} Exclusive Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlightedAmenities.map(amenity => (
              <ContextAwareAmenityCard
                key={amenity.id}
                amenity={amenity}
                collectionSlug={collectionSlug}
                terminalCode={terminalCode}
                onAmenityClick={onAmenityClick}
                showContext={true}
                showTerminalHighlight={true}
                className="ring-2 ring-yellow-300 ring-opacity-50"
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Amenities Section */}
      {regularAmenities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            📍 All {collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularAmenities.map(amenity => (
              <ContextAwareAmenityCard
                key={amenity.id}
                amenity={amenity}
                collectionSlug={collectionSlug}
                terminalCode={terminalCode}
                onAmenityClick={onAmenityClick}
                showContext={true}
                showTerminalHighlight={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900">{amenities.length}</div>
            <div className="text-gray-600">Total Options</div>
          </div>
          <div>
            <div className="font-semibold text-yellow-600">{highlightedAmenities.length}</div>
            <div className="text-gray-600">{terminalCode} Highlights</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{regularAmenities.length}</div>
            <div className="text-gray-600">Other Options</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{terminalHighlights.length}</div>
            <div className="text-gray-600">Terminal Specific</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalAwareCollection;

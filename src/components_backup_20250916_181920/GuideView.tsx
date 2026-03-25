import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAmenityFiltering } from '../hooks/useAmenityFiltering';
import { useJourneyPlanning } from '../hooks/useJourneyPlanning';
import type { AmenityLocation, UserPreferences } from '../types/amenity.types';
import { FilterBar } from './FilterBar';
import { AmenityGrid } from './AmenityGrid';
import { RecommendationSection } from './RecommendationSection';
import { JourneySummary } from './JourneySummary';
import { Button } from './ui/button';

interface GuideViewProps {
  amenities: AmenityLocation[];
  initialPreferences?: Partial<UserPreferences>;
}

export const GuideView: React.FC<GuideViewProps> = ({ 
  amenities, 
  initialPreferences 
}) => {
  const navigate = useNavigate();
  // Business logic handled by custom hooks
  const {
    filters,
    filteredAmenities,
    availableCategories,
    updateFilter,
    resetFilters,
    totalResults
  } = useAmenityFiltering({ 
    amenities,
    initialFilters: {
      categories: initialPreferences?.categories || [],
      priceRange: initialPreferences?.priceRange
    }
  });

  const {
    currentJourney,
    isPlanning,
    getRecommendations
  } = useJourneyPlanning(amenities);

  // Get available terminals from current amenities
  const availableTerminals = React.useMemo(() => {
    const terminals = new Set<string>();
    amenities.forEach(amenity => {
      if (amenity.terminal) {
        terminals.add(amenity.terminal);
      }
    });
    return Array.from(terminals).sort();
  }, [amenities]);

  // UI event handlers (no business logic)
  const handleFilterChange = <K extends keyof typeof filters>(
    key: K, 
    value: typeof filters[K]
  ) => {
    updateFilter(key, value);
  };

  const recommendations = currentJourney ? getRecommendations(8) : [];

  // Dark mode detection (same as journey stepper)
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
        </div>
        {/* Journey Summary */}
        {currentJourney && (
          <JourneySummary 
            journey={currentJourney}
            className="mb-8"
          />
        )}
        {/* Recommendations Section - Always Visible for Development */}
        {/* To see this carousel during local web development, it is now always visible. */}
        <div>
          {recommendations.length > 0 && (
            <RecommendationSection
              recommendations={recommendations}
              className="mb-8"
            />
          )}
        </div>
        {/* Filter Controls */}
        <FilterBar
          filters={filters}
          availableCategories={availableCategories}
          availableTerminals={availableTerminals}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          className="mb-6"
        />
        {/* Results Info */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {totalResults} amenities
          </p>
        </div>
        {/* Hide AmenityGrid for MVP mobile-only experience */}
        {/* <AmenityGrid
          amenities={filteredAmenities}
          loading={false}
          error={null}
        /> */}
      </div>
    </div>
  );
}; 
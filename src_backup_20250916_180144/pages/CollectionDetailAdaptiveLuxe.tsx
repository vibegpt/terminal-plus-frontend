// src/pages/CollectionDetailAdaptiveLuxe.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Star, DollarSign, Filter, 
  Grid3X3, List, Navigation, Heart, Users, TrendingUp,
  Sparkles, Coffee, ShoppingBag, Utensils, Armchair, Zap, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlassCard, 
  GlassCardHeavy, 
  LiveBadge, 
  LiveDot,
  MiniMap,
  Chip,
  GradientText,
  Skeleton,
  PageTransition
} from '../components/AdaptiveLuxe';
import { getCollectionConfig } from '../lib/supabase/queries';
import { useCollectionAmenitiesSimple, useCollectionDataSimple } from '../hooks/useSimpleData';
import { useNavigation } from '../hooks/useNavigation';
import { handleDeepLink } from '../utils/navigationHelpers';
import { AnalyticsManager } from '../utils/statePersistence';
import { EnrichedAmenity } from '../types/database.types';
import { isHiddenGemsFreeAmenity } from '../config/hiddenGemsFreeAmenities';
import { SimpleLoader, SimpleError, SimpleEmpty } from '../components/SimpleUI';
import AmenityContainer from '../components/AmenityContainer';
import '../styles/adaptive-luxe.css';

// Get time-based theme
const getTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'day';
  return 'night';
};

const CollectionDetailAdaptiveLuxe: React.FC = () => {
  // Get collection slug from simplified route: /collection/:collectionSlug
  const { collectionSlug } = useParams();
  const { navigateToAmenity, navigateBack, searchParams, isDeepLink } = useNavigation();
  
  // State management
  const [viewMode, setViewMode] = useState<'cards' | 'spotlight' | 'flow'>('cards');
  const [filters, setFilters] = useState({
    openNow: false,
    priceLevel: 'all',
    sortBy: 'recommended',
    searchQuery: ''
  });
  const [savedAmenities, setSavedAmenities] = useState<string[]>([]);
  
  // Use the simple data hooks
  const { amenities, loading, error } = useCollectionAmenitiesSimple(collectionSlug);
  const { collection: collectionData, loading: collectionLoading } = useCollectionDataSimple(collectionSlug);

  // Get collection configuration
  const collectionConfig = collectionData ? getCollectionConfig(collectionData.slug) : null;

  // Handle deep links on mount
  useEffect(() => {
    if (isDeepLink) {
      handleDeepLink({
        collectionSlug: collectionSlug,
        airport: searchParams.get('airport') || undefined,
        terminal: searchParams.get('terminal') || undefined
      });
    }
  }, [collectionSlug, isDeepLink, searchParams]);

  // Navigate to amenity detail
  const handleAmenityClick = (amenity: EnrichedAmenity) => {
    // Track analytics
    AnalyticsManager.trackAmenityInteraction(amenity.amenity_slug, 'clicked', {
      from_collection: collectionSlug
    });
    
    // Use centralized navigation with vibe context
    const defaultVibe = 'discover'; // Default vibe for terminal-based collections
    navigateToAmenity(amenity, collectionSlug);
  };

  // Handle save amenity
  const handleSaveAmenity = (amenity: EnrichedAmenity) => {
    setSavedAmenities(prev => {
      if (prev.includes(amenity.amenity_slug)) {
        return prev.filter(slug => slug !== amenity.amenity_slug);
      } else {
        return [...prev, amenity.amenity_slug];
      }
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigateBack();
  };

  // Filter function
  const applyFilters = (amenities: EnrichedAmenity[], filters: any) => {
    let filtered = [...amenities];
    
    if (filters.openNow) {
      filtered = filtered.filter(a => a.isOpen);
    }
    
    if (filters.priceLevel !== 'all') {
      filtered = filtered.filter(a => a.price_level === filters.priceLevel);
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.vibe_tags?.toLowerCase().includes(query)
      );
    }
    
    // Sorting
    switch (filters.sortBy) {
              case 'distance':
          filtered.sort((a, b) => {
            const aTime = parseInt(a.walkTime || '99');
            const bTime = parseInt(b.walkTime || '99');
            return aTime - bTime;
          });
        break;
      case 'price-low':
        filtered.sort((a, b) => getPriceValue(a.price_level) - getPriceValue(b.price_level));
        break;
      case 'price-high':
        filtered.sort((a, b) => getPriceValue(b.price_level) - getPriceValue(a.price_level));
        break;
      case 'recommended':
      default:
        // Keep original order or use a recommendation score
        break;
    }
    
    return filtered;
  };

  // Helper function to get numeric price value for sorting
  const getPriceValue = (priceLevel?: string): number => {
    switch (priceLevel) {
      case '$': return 1;
      case '$$': return 2;
      case '$$$': return 3;
      case '$$$$': return 4;
      default: return 0; // Free or unknown
    }
  };

  // Collection Header Component
  const CollectionHeader = ({ collection, onBack, viewMode, onViewModeChange }: any) => (
    <div className="sticky top-0 z-40 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        
        <h1 className="text-lg font-bold text-white">
          {collection?.name || 'Collection'}
        </h1>
        
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg backdrop-blur">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-white/20' : ''}`}
          >
            <Grid3X3 className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={() => onViewModeChange('spotlight')}
            className={`p-1.5 rounded ${viewMode === 'spotlight' ? 'bg-white/20' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={() => onViewModeChange('flow')}
            className={`p-1.5 rounded ${viewMode === 'flow' ? 'bg-white/20' : ''}`}
          >
            <List className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  // Filter Bar Component
  const FilterBar = ({ filters, onFiltersChange, amenityCount }: any) => (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search amenities..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onFiltersChange({ ...filters, openNow: !filters.openNow })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            filters.openNow ? 'bg-green-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          {filters.openNow ? '✓' : '○'} Open Now
        </button>
        
        <button
          onClick={() => onFiltersChange({ ...filters, priceLevel: 'all' })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            filters.priceLevel === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          All Prices
        </button>
        
        <button
          onClick={() => onFiltersChange({ ...filters, priceLevel: '$' })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            filters.priceLevel === '$' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          Budget
        </button>
        
        <button
          onClick={() => onFiltersChange({ ...filters, priceLevel: '$$$' })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            filters.priceLevel === '$$$' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          Premium
        </button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {amenityCount} amenities
      </div>
    </div>
  );

  // Apply filters to amenities
  const filteredAmenities = amenities ? applyFilters(amenities, filters) : [];

  // Debug info
  console.log('CollectionDetailAdaptiveLuxe Debug:', {
    collectionSlug,
    pathname: window.location.pathname,
    amenitiesCount: amenities?.length,
    loading,
    error
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27]">
        {/* Header with collection info */}
        <CollectionHeader 
          collection={collectionData}
          onBack={handleBack}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {/* Filter Bar */}
        {!loading && !error && (
          <FilterBar 
            filters={filters}
            onFiltersChange={setFilters}
            amenityCount={filteredAmenities.length}
          />
        )}
        
        {/* Loading State */}
        {loading && <SimpleLoader />}
        
        {/* Error State */}
        {error && <SimpleError message={error} onRetry={() => window.location.reload()} />}
        
        {/* Amenities Grid/List/Flow */}
        {!loading && !error && filteredAmenities.length > 0 && (
          <AmenityContainer
            amenities={filteredAmenities as EnrichedAmenity[]}
            viewMode={viewMode}
            onAmenityClick={handleAmenityClick}
          />
        )}
        
        {/* Empty State */}
        {!loading && !error && filteredAmenities.length === 0 && (
          <SimpleEmpty 
            message={filters.searchQuery || filters.openNow || filters.priceLevel !== 'all' 
              ? "No amenities match your filters" 
              : "No amenities found in this collection"}
            onAction={() => {
              if (filters.searchQuery || filters.openNow || filters.priceLevel !== 'all') {
                setFilters({
                  openNow: false,
                  priceLevel: 'all',
                  sortBy: 'recommended',
                  searchQuery: ''
                });
              } else {
                window.history.back();
              }
            }}
            actionText={filters.searchQuery || filters.openNow || filters.priceLevel !== 'all' 
              ? "Clear Filters" 
              : "Go Back"}
          />
        )}
        
        {/* Collection Info */}
        {collectionData?.isDynamicCollection && (
          <div className="px-4 pb-6">
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">Curated for you</h3>
                  <p className="text-xs text-white/60">
                    This collection is specially selected based on the time of day and popular choices.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      
        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center z-20"
          onClick={() => navigateBack()}
        >
          <MapPin className="h-6 w-6 text-white" />
        </motion.button>
      </div>
    </PageTransition>
  );
};

export default CollectionDetailAdaptiveLuxe;

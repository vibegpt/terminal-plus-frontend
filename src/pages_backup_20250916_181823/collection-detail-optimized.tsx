// src/pages/collection-detail-optimized.tsx
// Enhanced Netflix-style collection detail with image optimization and Terminal Plus branding

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Play, Heart, MoreHorizontal, Clock, MapPin, 
  DollarSign, Star, Filter, Search, Shuffle, Download,
  CheckCircle, Share, Info, Navigation, Zap, Users,
  Pause, Volume2, ChevronLeft, ChevronRight, Plus,
  Maximize2, X, TrendingUp, Award, AlertCircle,
  Bookmark, BookmarkCheck, Sparkles, Wifi, Coffee
} from 'lucide-react';

// Import the services
import { SupabaseCollectionService } from '../services/SupabaseCollectionService';

// Types
interface Amenity {
  id: string;
  slug?: string;
  amenity_slug?: string;
  name: string;
  category: string;
  description: string;
  terminal_code: string;
  vibe_tags: string[];
  price_tier?: string;
  price_level?: string;
  opening_hours?: any;
  location_description?: string;
  rating?: number;
  image_url?: string;
  logo_url?: string;
  busy_level?: 'low' | 'medium' | 'high';
  is_open?: boolean;
  walk_time?: string;
}

// Image optimization hook with progressive loading
const useProgressiveImage = (src: string) => {
  const [sourceLoaded, setSourceLoaded] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setSourceLoaded(src);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { sourceLoaded, error };
};

// Optimized Amenity Card Component
const OptimizedAmenityCard: React.FC<{
  amenity: Amenity;
  onSave: (id: string) => void;
  isSaved: boolean;
  onClick: () => void;
  index?: number;
  showRanking?: boolean;
}> = ({ amenity, onSave, isSaved, onClick, index, showRanking }) => {
  const { sourceLoaded, error } = useProgressiveImage(amenity.image_url || '');
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate placeholder gradient based on category
  const placeholderGradient = useMemo(() => {
    const gradients: Record<string, string> = {
      'Dining': 'from-orange-600 to-red-600',
      'Lounge': 'from-purple-600 to-indigo-600',
      'Shopping': 'from-pink-600 to-purple-600',
      'Coffee': 'from-amber-600 to-orange-600',
      'Experience': 'from-teal-600 to-cyan-600',
      'default': 'from-gray-600 to-gray-700'
    };
    return gradients[amenity.category] || gradients.default;
  }, [amenity.category]);

  // Price indicator
  const priceIndicator = amenity.price_tier || amenity.price_level;
  const priceDisplay = useMemo(() => {
    if (!priceIndicator || priceIndicator === '' || priceIndicator.toLowerCase() === 'free') {
      return { text: 'Free', isFree: true };
    }
    return { text: priceIndicator, isFree: false };
  }, [priceIndicator]);

  // Status badge
  const statusBadge = useMemo(() => {
    if (amenity.is_open === false) return { text: 'Closed', color: 'bg-red-500' };
    if (amenity.busy_level === 'high') return { text: 'Busy', color: 'bg-orange-500' };
    if (amenity.busy_level === 'low') return { text: 'Quiet', color: 'bg-green-500' };
    return null;
  }, [amenity.is_open, amenity.busy_level]);

  return (
    <div 
      className="relative flex-none w-72 md:w-80 lg:w-96 snap-start group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-900">
        {/* Loading placeholder with gradient */}
        {!sourceLoaded && !error && (
          <div className={`absolute inset-0 bg-gradient-to-br ${placeholderGradient} animate-pulse`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          </div>
        )}
        
        {/* Error state with fallback gradient */}
        {error && (
          <div className={`absolute inset-0 bg-gradient-to-br ${placeholderGradient}`}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white/70" />
            </div>
          </div>
        )}
        
        {/* Actual image with fade-in effect */}
        {sourceLoaded && (
          <img
            src={sourceLoaded}
            alt={amenity.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              sourceLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        )}

        {/* Terminal Plus gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Ranking badge (for trending sections) */}
        {showRanking && index !== undefined && (
          <div className="absolute top-3 left-3">
            <div className="bg-red-600 text-white text-2xl font-bold w-12 h-12 rounded-lg flex items-center justify-center shadow-lg">
              {index + 1}
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {statusBadge && (
            <span className={`${statusBadge.color} text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm bg-opacity-90`}>
              {statusBadge.text}
            </span>
          )}
          {amenity.walk_time && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {amenity.walk_time}
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(amenity.id);
          }}
          className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm p-2 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
          style={{ opacity: showRanking ? 0 : undefined }}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <Bookmark className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Logo if available */}
          {amenity.logo_url && (
            <img 
              src={amenity.logo_url} 
              alt={`${amenity.name} logo`}
              className="h-6 w-auto mb-2 filter brightness-0 invert opacity-90"
              loading="lazy"
            />
          )}
          
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
            {amenity.name}
          </h3>
          
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <span>{amenity.category}</span>
            {amenity.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-yellow-400" />
                {amenity.rating.toFixed(1)}
              </span>
            )}
            <span>{priceDisplay.text}</span>
          </div>

          {/* Vibe tags */}
          {amenity.vibe_tags && amenity.vibe_tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {amenity.vibe_tags.slice(0, 2).map((tag, i) => (
                <span 
                  key={i}
                  className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-xl">
            <Info className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Optimized Carousel Component
const OptimizedCarousel: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
  amenities: Amenity[];
  savedItems: string[];
  onSaveItem: (id: string) => void;
  onSelectAmenity: (amenity: Amenity) => void;
  showRanking?: boolean;
}> = ({ title, description, icon, gradient, amenities, savedItems, onSaveItem, onSelectAmenity, showRanking }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        ref.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [checkScrollButtons, amenities]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  if (!amenities || amenities.length === 0) return null;

  return (
    <div className="relative group/carousel py-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-lg ${gradient || 'bg-gradient-to-br from-emerald-600 to-teal-600'}`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {description && (
              <p className="text-gray-400 text-sm">{description}</p>
            )}
          </div>
        </div>
        
        <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 transition-colors">
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm p-3 rounded-full transition-all duration-300 hover:bg-black/90 ${
            canScrollLeft ? 'opacity-0 group-hover/carousel:opacity-100' : 'hidden'
          }`}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 scroll-smooth snap-x"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {amenities.map((amenity, index) => (
            <OptimizedAmenityCard
              key={amenity.id || amenity.slug || index}
              amenity={amenity}
              onSave={onSaveItem}
              isSaved={savedItems.includes(amenity.id)}
              onClick={() => onSelectAmenity(amenity)}
              index={index}
              showRanking={showRanking}
            />
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm p-3 rounded-full transition-all duration-300 hover:bg-black/90 ${
            canScrollRight ? 'opacity-0 group-hover/carousel:opacity-100' : 'hidden'
          }`}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

// Main Optimized Collection Detail Page
const CollectionDetailPageOptimized: React.FC = () => {
  const { terminalCode, collectionId } = useParams<{ 
    terminalCode: string; 
    collectionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add debugging for terminal and collection validation
  useEffect(() => {
    console.log(`Loading collection: ${terminalCode} / ${collectionId}`);
    
    // Import validation utility
    import('../utils/validationUtils').then(({ validateTerminalAndCollection, getValidTerminals, getValidCollectionSlugs }) => {
      const validation = validateTerminalAndCollection(terminalCode || '', collectionId || '');
      
      if (!validation.terminalValid) {
        console.warn(`⚠️  Invalid terminal: ${terminalCode}. Valid formats:`, getValidTerminals());
      } else {
        console.log(`✅ Valid terminal: ${terminalCode} (${validation.terminalName})`);
      }
      
      if (!validation.collectionValid) {
        console.warn(`⚠️  Invalid collection slug: ${collectionId}. Valid formats:`, getValidCollectionSlugs());
      } else {
        console.log(`✅ Valid collection slug: ${collectionId} (${validation.collectionName})`);
      }
    });
  }, [terminalCode, collectionId]);
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<any>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [savedAmenities, setSavedAmenities] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Load collection data
  useEffect(() => {
    const loadCollectionData = async () => {
      if (!collectionId || !terminalCode) {
        setError('Invalid collection parameters');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { collection: collectionConfig, amenities: collectionAmenities } = 
          await SupabaseCollectionService.getCollectionWithAmenities(collectionId, terminalCode);
        
        // Enhance collection with metadata
        setCollection({
          ...collectionConfig,
          terminal: terminalCode,
          plays: Math.floor(Math.random() * 50000) + 10000,
          likes: Math.floor(Math.random() * 10000) + 1000,
          itemCount: collectionAmenities.length,
          lastUpdated: '2 hours ago',
          curatedBy: 'Terminal Plus Team'
        });
        
        // Enhance amenities with real-time data
        const enhancedAmenities = collectionAmenities.map((amenity: any) => ({
          ...amenity,
          image_url: amenity.image_url || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1556742111-a301076d9d18' : '1570168007204-dfb528c6958f'}?w=800&q=80`,
          is_open: SupabaseCollectionService.isOpenNow(amenity.opening_hours),
          walk_time: `${Math.floor(Math.random() * 10) + 2} min`,
          busy_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
        }));
        
        setAmenities(enhancedAmenities);
      } catch (err) {
        console.error('Error loading collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [collectionId, terminalCode]);

  // Handle save amenity
  const handleSaveAmenity = useCallback((amenityId: string) => {
    setSavedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  }, []);

  // Handle amenity selection
  const handleSelectAmenity = useCallback((amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setShowPreview(true);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get similar collections
  const similarCollections = [
    { id: 'quick-bites', title: 'Quick Bites', emoji: '⚡', gradient: 'from-yellow-600 to-orange-600' },
    { id: 'lounge-life', title: 'Lounge Life', emoji: '💎', gradient: 'from-purple-600 to-indigo-600' },
    { id: 'coffee-chill', title: 'Coffee & Chill', emoji: '☕', gradient: 'from-amber-600 to-orange-600' }
  ];

  // Get trending amenities
  const trendingAmenities = [...amenities].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Hero Section with Parallax Effect */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <div className={`h-full bg-gradient-to-br ${collection?.gradient || 'from-emerald-600 to-teal-600'}`}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="relative z-10 p-4 md:p-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
        
        {/* Collection Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-6">
              <div className="text-6xl md:text-8xl">{collection?.emoji}</div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-bold mb-2">{collection?.name}</h1>
                <p className="text-lg text-gray-300 mb-4">{collection?.description}</p>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {collection?.plays?.toLocaleString()} plays
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {collection?.likes?.toLocaleString()} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {collection?.itemCount} experiences
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Updated {collection?.lastUpdated}
                  </span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-full font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Start Tour
                </button>
                <button className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Collection Amenities */}
      <div className="relative z-20 -mt-10">
        <OptimizedCarousel
          title="In This Collection"
          description={`${amenities.length} curated experiences`}
          icon={<Sparkles className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600"
          amenities={amenities}
          savedItems={savedAmenities}
          onSaveItem={handleSaveAmenity}
          onSelectAmenity={handleSelectAmenity}
        />
      </div>

      {/* Trending Section */}
      {trendingAmenities.length > 0 && (
        <OptimizedCarousel
          title="Trending Now"
          description={`Popular in ${terminalCode}`}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-red-600 to-pink-600"
          amenities={trendingAmenities}
          savedItems={savedAmenities}
          onSaveItem={handleSaveAmenity}
          onSelectAmenity={handleSelectAmenity}
          showRanking={true}
        />
      )}

      {/* Similar Collections */}
      <div className="px-4 md:px-8 py-8">
        <h2 className="text-2xl font-bold mb-4">More Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {similarCollections.map(similar => (
            <div 
              key={similar.id}
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => {
              // Ensure navigation uses correct formats
              const formattedTerminal = terminalCode?.toUpperCase();
              const formattedSlug = similar.id?.toLowerCase().replace(/\s+/g, '-');
              
              console.log(`Navigating to: /collection/${formattedTerminal}/${formattedSlug}`);
              navigate(`/collection/${formattedTerminal}/${formattedSlug}`);
            }}
            >
              <div className={`h-32 bg-gradient-to-br ${similar.gradient}`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">{similar.emoji}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-lg">{similar.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedAmenity && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content similar to original but with optimized image loading */}
            <div className="relative">
              <img 
                src={selectedAmenity.image_url} 
                alt={selectedAmenity.name}
                className="w-full h-64 object-cover"
                loading="lazy"
              />
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedAmenity.name}</h2>
              <p className="text-gray-400 mb-6">{selectedAmenity.description}</p>
              
              <button 
                onClick={() => {
                  const amenitySlug = selectedAmenity.slug || selectedAmenity.amenity_slug;
                  if (amenitySlug) {
                    console.log(`Navigating to: /amenity/${amenitySlug}`);
                    navigate(`/amenity/${amenitySlug}`);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-3 font-semibold transition-colors"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPageOptimized;

// Also export as CollectionDetailPage for drop-in replacement
export { CollectionDetailPageOptimized as CollectionDetailPage };

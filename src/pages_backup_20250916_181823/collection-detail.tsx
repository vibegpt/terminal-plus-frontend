// src/pages/collection-detail.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Play, Heart, MoreHorizontal, Clock, MapPin, 
  DollarSign, Star, Filter, Search, Shuffle, Download,
  CheckCircle, Share, Info, Navigation, Zap, Users,
  Pause, Volume2, ChevronLeft, ChevronRight, Plus,
  Maximize2, X, TrendingUp, Award, AlertCircle
} from 'lucide-react';

// Import the services
import { SupabaseCollectionService } from '../services/SupabaseCollectionService';
import { isHiddenGemsFreeAmenity } from '../config/hiddenGemsFreeAmenities';

interface Amenity {
  id: string | number;
  slug?: string;
  amenity_slug?: string;
  name: string;
  category?: string;
  description: string;
  terminal_code: string;
  vibe_tags: string | string[];
  price_tier?: string;
  price_level?: string;
  opening_hours?: any;
  location_description?: string;
  rating?: number;
  image_url?: string;
}

const CollectionDetailPage: React.FC = () => {
  const { terminalCode, collectionId } = useParams<{ 
    terminalCode: string; 
    collectionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State from navigation
  const navState = location.state as any;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<any>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [savedAmenities, setSavedAmenities] = useState<string[]>([]);
  const [filterVibe, setFilterVibe] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Carousel refs for each section
  const mainCarouselRef = useRef<HTMLDivElement>(null);
  const similarCarouselRef = useRef<HTMLDivElement>(null);
  const trendingCarouselRef = useRef<HTMLDivElement>(null);

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Load collection data
  useEffect(() => {
    const loadCollectionData = async () => {
      if (!collectionId || !terminalCode) {
        console.error('Missing required params:', { collectionId, terminalCode });
        setError('Invalid collection parameters');
        setLoading(false);
        return;
      }
      
      console.log('Loading collection:', collectionId, 'for terminal:', terminalCode);
      setLoading(true);
      setError(null);
      
      try {
        // Get collection with amenities from Supabase
        const { collection: collectionConfig, amenities: collectionAmenities } = 
          await SupabaseCollectionService.getCollectionWithAmenities(collectionId, terminalCode);
        
        console.log('Collection loaded successfully:', collectionConfig.name);
        console.log('Amenities count:', collectionAmenities.length);
        
        setCollection({
          ...collectionConfig,
          terminal: terminalCode,
          airport: getAirportName(terminalCode),
          plays: Math.floor(Math.random() * 50000) + 10000,
          likes: Math.floor(Math.random() * 10000) + 1000,
          totalDuration: calculateTotalDuration(collectionAmenities),
          itemCount: collectionAmenities.length,
          lastUpdated: '2 hours ago',
          curatedBy: 'Terminal Plus Team'
        });
        
        // Enhance amenities with default images if missing
        const enhancedAmenities = collectionAmenities.map((amenity: any) => ({
          ...amenity,
          id: amenity.id?.toString() || amenity.amenity_slug || amenity.slug || '',
          image_url: amenity.image_url || getDefaultAmenityImage(amenity.category),
          price_tier: amenity.price_tier || amenity.price_level,
          vibe_tags: amenity.vibe_tags || []
        }));
        
        setAmenities(enhancedAmenities);
        setLoading(false);
      } catch (err) {
        console.error('Error loading collection:', err);
        setError('Failed to load collection');
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [collectionId, terminalCode]);

  // Get similar collections
  const [similarCollections, setSimilarCollections] = useState<any[]>([]);
  
  // Load similar collections
  useEffect(() => {
    async function loadSimilar() {
      if (collectionId && terminalCode) {
        try {
          const airportCode = terminalCode.split('-')[0];
          const similar = await SupabaseCollectionService.getSimilarCollections(collectionId, airportCode);
          setSimilarCollections(similar);
        } catch (error) {
          console.error('Error loading similar collections:', error);
        }
      }
    }
    loadSimilar();
  }, [collectionId, terminalCode]);

  // Helper functions
  const getAirportName = (code: string): string => {
    const airports: Record<string, string> = {
      'SIN-T1': 'Singapore Changi',
      'SIN-T2': 'Singapore Changi',
      'SIN-T3': 'Singapore Changi',
      'LHR-T2': 'London Heathrow',
      'LHR-T3': 'London Heathrow',
      'LHR-T4': 'London Heathrow',
      'LHR-T5': 'London Heathrow',
      'SYD-T1': 'Sydney Kingsford Smith',
      'SYD-T2': 'Sydney Kingsford Smith',
      'SYD-T3': 'Sydney Kingsford Smith'
    };
    return airports[code] || code;
  };

  const calculateTotalDuration = (amenities: Amenity[]): string => {
    const totalMinutes = amenities.length * 30; // Assume 30 min per amenity
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const getDefaultAmenityImage = (category: string): string => {
    // Generate appropriate default images based on amenity type
    const slug = category.toLowerCase().replace(/\s+/g, '-');
    const images: Record<string, string> = {
      'butterfly-garden': 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&h=450&fit=crop',
      'the-slide': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&h=450&fit=crop',
      'jewel-viewpoint': 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&h=450&fit=crop',
      'movie-theatre': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop',
      'cactus-garden': 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&h=450&fit=crop',
      'entertainment-deck': 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&h=450&fit=crop',
      'cultural-stage': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
      'snooze-lounge': 'https://images.unsplash.com/photo-1521783988139-89397d761dce?w=800&h=450&fit=crop',
      'fish-spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=450&fit=crop',
      'gordon-ramsay': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=450&fit=crop',
      'aw-root-beer': 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&h=450&fit=crop',
      'concorde-room': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=450&fit=crop',
      'sofitel-dayroom': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=450&fit=crop',
      'ba-heritage': 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=450&fit=crop',
      'prayer-room': 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&h=450&fit=crop',
      'qantas-first-lounge': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=450&fit=crop',
      'sydney-harbour-bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=450&fit=crop'
    };
    
    // Return specific image or generic based on category
    if (images[slug]) return images[slug];
    
    // Default images by category
    if (category.toLowerCase().includes('food') || category.toLowerCase().includes('restaurant')) {
      return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=450&fit=crop';
    }
    if (category.toLowerCase().includes('lounge')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=450&fit=crop';
    }
    if (category.toLowerCase().includes('garden') || category.toLowerCase().includes('nature')) {
      return 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&h=450&fit=crop';
    }
    
    // Generic airport amenity image
    return 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&h=450&fit=crop';
  };

  // Carousel navigation
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.offsetWidth * 0.8;
      const currentScroll = ref.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      ref.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      scrollCarousel(ref, 'right');
    }
    if (isRightSwipe) {
      scrollCarousel(ref, 'left');
    }
  };

  // Event handlers
  const handleSaveAmenity = (amenityId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handlePlayCollection = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentPlayingIndex(0);
    }
  };

  const handleAmenityClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setShowPreview(true);
  };

  const handleNavigateToAmenity = (amenity: Amenity) => {
    const slug = amenity.slug || amenity.amenity_slug || amenity.id;
    navigate(`/amenity/${slug}`, {
      state: { amenity, fromCollection: collection?.id }
    });
  };

  // Get unique vibes from amenities
  const allVibes = Array.from(new Set(amenities.flatMap(a => {
    const tags = a.vibe_tags;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return tags.split(',').filter(Boolean);
    return [];
  })));

  // Filter amenities
  const filteredAmenities = filterVibe === 'all' 
    ? amenities 
    : filterVibe === 'free' 
      ? amenities.filter(a => {
          const price = a.price_tier || a.price_level;
          return !price || price === 'Free' || price === '$';
        })
      : amenities.filter(a => {
          const tags = a.vibe_tags;
          if (Array.isArray(tags)) return tags.includes(filterVibe);
          if (typeof tags === 'string') return tags.includes(filterVibe);
          return false;
        });

  // Calculate stats
  const totalWalkTime = amenities.length * 5;
  const averageRating = amenities.length > 0
    ? (amenities.reduce((acc, a) => acc + (a.rating || 4.5), 0) / amenities.length).toFixed(1)
    : '4.5';
  const freeAmenities = amenities.filter(a => {
    const price = a.price_tier || a.price_level;
    return !price || price === 'Free' || price === '$';
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500 mx-auto mb-4" />
          <p>Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error && !collection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl mb-4">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-green-500 rounded-full text-black font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Collection not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-green-500 rounded-full text-black font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
      {/* Show error banner if amenities failed to load */}
      {error && collection && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Netflix-style hero section */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          {amenities.length > 0 ? (
            <img 
              src={amenities[0]?.image_url || ''} 
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${collection.gradient || 'from-purple-600 to-blue-600'}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>
        
        {/* Navigation bar */}
        <div className="relative flex items-center justify-between p-4 pt-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all backdrop-blur-sm"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all backdrop-blur-sm">
              <Share className="h-6 w-6" />
            </button>
            <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all backdrop-blur-sm">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-5xl`}>{collection.emoji || collection.icon}</span>
              <span className="text-sm uppercase tracking-wider opacity-70">
                {collection.terminal} • {collection.airport}
              </span>
            </div>
            
            <h1 className="text-6xl font-bold mb-4">{collection.title || collection.name}</h1>
            <p className="text-xl opacity-90 mb-6">{collection.subtitle || collection.description}</p>
            
            <div className="flex items-center gap-4 mb-8 text-sm">
              {amenities.length > 0 && (
                <>
                  <span className="text-green-500 font-semibold">95% Match</span>
                  <span className="border border-gray-600 px-2 py-1 rounded">
                    {collection.itemCount || amenities.length} Experiences
                  </span>
                  <span>{collection.totalDuration}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                    {averageRating}
                  </span>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4">
              {amenities.length > 0 && (
                <button 
                  onClick={handlePlayCollection}
                  className="bg-white hover:bg-gray-200 text-black rounded px-8 py-3 flex items-center gap-2 font-semibold transition-all"
                >
                  <Play className="h-5 w-5" fill="currentColor" />
                  Start Tour
                </button>
              )}
              <button className="bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded px-8 py-3 flex items-center gap-2 font-semibold transition-all">
                <Plus className="h-5 w-5" />
                My List
              </button>
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="p-3 rounded-full border-2 border-gray-600 hover:border-white transition-all"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info dropdown */}
      {showInfo && (
        <div className="bg-gray-900/50 backdrop-blur-sm border-y border-gray-800 p-6">
          <div className="max-w-4xl">
            <p className="text-gray-300 mb-4">{collection.description}</p>
            <div className="flex gap-8 text-sm">
              <div>
                <span className="text-gray-500">Curated by:</span>
                <span className="ml-2">{collection.curatedBy}</span>
              </div>
              {amenities.length > 0 && (
                <>
                  <div>
                    <span className="text-gray-500">This collection:</span>
                    <span className="ml-2">{freeAmenities} free experiences</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Walking time:</span>
                    <span className="ml-2">{totalWalkTime} min total</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Only show amenities section if we have amenities */}
      {amenities.length > 0 ? (
        <>
          {/* Filter pills */}
          <div className="px-8 py-4 flex items-center gap-3">
            <button 
              onClick={() => setFilterVibe('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterVibe === 'all' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              All
            </button>
            {allVibes.slice(0, 4).map(vibe => (
              <button 
                key={vibe}
                onClick={() => setFilterVibe(vibe)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterVibe === vibe 
                    ? 'bg-white text-black' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {vibe}
              </button>
            ))}
            <button 
              onClick={() => setFilterVibe('free')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterVibe === 'free' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              Free Only
            </button>
          </div>

          {/* Main carousel section */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Experiences in this Collection</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollCarousel(mainCarouselRef, 'left')}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => scrollCarousel(mainCarouselRef, 'right')}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Netflix-style carousel */}
            <div 
              ref={mainCarouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(mainCarouselRef)}
            >
              {filteredAmenities.map((amenity, index) => {
                const amenityId = (amenity.id || amenity.slug || amenity.amenity_slug || '').toString();
                const isSaved = savedAmenities.includes(amenityId);
                const isHovered = hoveredCard === amenityId;
                const isCurrentlyPlaying = isPlaying && currentPlayingIndex === index;
                
                return (
                  <div 
                    key={amenityId}
                    className="flex-none w-72 snap-start group cursor-pointer"
                    onMouseEnter={() => setHoveredCard(amenityId)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleAmenityClick(amenity)}
                  >
                    <div className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                      isHovered ? 'scale-105 z-10' : ''
                    }`}>
                      {/* Image */}
                      <div className="relative aspect-video">
                        <img 
                          src={amenity.image_url} 
                          alt={amenity.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {/* Playing indicator */}
                        {isCurrentlyPlaying && (
                          <div className="absolute top-4 left-4 bg-green-500 px-3 py-1 rounded-full flex items-center gap-2">
                            <Volume2 className="h-3 w-3 animate-pulse" />
                            <span className="text-xs font-medium">Now Playing</span>
                          </div>
                        )}
                        
                        {/* Hidden Gems Free Badge */}
                        {collectionId === 'hidden-gems' && isHiddenGemsFreeAmenity(amenity.slug || amenity.amenity_slug || (amenity.id || '').toString()) && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
                            <span>✨</span>
                            <span>FREE</span>
                          </div>
                        )}
                        
                        {/* Save button */}
                        <button 
                          onClick={(e) => handleSaveAmenity(amenityId, e)}
                          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                        >
                          {isSaved ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                        
                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {(() => {
                              const tags = amenity.vibe_tags;
                              if (Array.isArray(tags)) {
                                return tags.slice(0, 2).map(tag => (
                                  <span 
                                    key={tag}
                                    className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ));
                              }
                              if (typeof tags === 'string') {
                                const tagArray = tags.split(',').filter(Boolean);
                                return tagArray.slice(0, 2).map(tag => (
                                  <span 
                                    key={tag}
                                    className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ));
                              }
                              return null;
                            })()}
                            {(() => {
                              const amenitySlug = amenity.slug || amenity.amenity_slug || (amenity.id || '').toString();
                              const price = amenity.price_tier || amenity.price_level;
                              
                              // Check if this is a Hidden Gems collection
                              const isHiddenGemsCollection = collectionId === 'hidden-gems';
                              
                              // For Hidden Gems collection, check if it's a free amenity
                              if (isHiddenGemsCollection && isHiddenGemsFreeAmenity(amenitySlug)) {
                                return (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                    Free
                                  </span>
                                );
                              }
                              
                              // For other free amenities or those without price
                              if (!price || price === 'Free' || price === '$') {
                                return (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                    {price || 'Free'}
                                  </span>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-1">{amenity.name}</h3>
                          <p className="text-sm text-gray-300 line-clamp-2">{amenity.description}</p>
                          
                          {/* Quick stats */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            {amenity.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
                                {amenity.rating.toFixed(1)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              30 min
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              5 min walk
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover play button */}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                          <button className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                            <Play className="h-8 w-8" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Show message when no amenities */
        <div className="px-8 py-12 text-center">
          <div className="bg-gray-900/50 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No experiences available</h3>
            <p className="text-gray-400">
              This collection doesn't have any experiences in {collection.terminal} yet.
            </p>
          </div>
        </div>
      )}

      {/* Similar collections section */}
      {similarCollections.length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold mb-4">More Like This</h2>
          <div 
            ref={similarCarouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {similarCollections.map(similar => {
              if (!similar) return null;
              
              return (
                <div 
                  key={similar.collection_id}
                  className="flex-none w-64 snap-start cursor-pointer group"
                  onClick={() => navigate(`/collection/${terminalCode}/${similar.collection_id}`)}
                >
                  <div className="relative rounded-lg overflow-hidden">
                    <div className={`h-36 bg-gradient-to-br ${similar.gradient}`} />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">{similar.emoji}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black">
                      <h3 className="font-semibold group-hover:text-green-400 transition-colors">
                        {similar.title}
                      </h3>
                      <p className="text-xs text-gray-400">Explore more</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending now section - only show if we have amenities */}
      {amenities.length > 0 && (
        <div className="px-8 py-6 mb-20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h2 className="text-2xl font-bold">Trending Now in {collection.terminal}</h2>
          </div>
          <div 
            ref={trendingCarouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {amenities.slice(0, 5).map((amenity, index) => {
              const amenityId = amenity.id || amenity.slug || amenity.amenity_slug || '';
              return (
                <div 
                  key={`trending-${amenityId}`}
                  className="flex-none w-48 snap-start cursor-pointer group"
                  onClick={() => handleAmenityClick(amenity)}
                >
                  <div className="relative rounded-lg overflow-hidden aspect-[2/3]">
                    <img 
                      src={amenity.image_url} 
                      alt={amenity.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="text-4xl font-bold text-red-500">{index + 1}</div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-sm">{amenity.name}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick preview modal */}
      {showPreview && selectedAmenity && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img 
                src={selectedAmenity.image_url} 
                alt={selectedAmenity.name}
                className="w-full h-64 object-cover"
              />
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedAmenity.name}</h2>
                  <p className="text-gray-400">{selectedAmenity.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 font-semibold">
                    {SupabaseCollectionService.isOpenNow(selectedAmenity.opening_hours) ? 'Open Now' : 'Closed'}
                  </span>
                  {selectedAmenity.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                      {selectedAmenity.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">{selectedAmenity.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="font-semibold">30 min</p>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <Navigation className="h-5 w-5 mx-auto mb-1 text-green-400" />
                  <p className="text-sm text-gray-400">Walk Time</p>
                  <p className="font-semibold">5 min</p>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="font-semibold flex items-center justify-center gap-1">
                    {(() => {
                      const amenitySlug = selectedAmenity.slug || selectedAmenity.amenity_slug || (selectedAmenity.id || '').toString();
                      const price = selectedAmenity.price_tier || selectedAmenity.price_level;
                      
                      // Check if viewing Hidden Gems collection
                      if (collectionId === 'hidden-gems' && isHiddenGemsFreeAmenity(amenitySlug)) {
                        return <span className="text-green-400 font-medium">Free</span>;
                      }
                      
                      if (!price || price === '') {
                        return <span className="text-green-400">Free</span>;
                      }
                      return (
                        <>
                          <DollarSign className="h-4 w-4" />
                          <span>{price}</span>
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleNavigateToAmenity(selectedAmenity)}
                  className="flex-1 bg-white text-black rounded-lg py-3 font-semibold hover:bg-gray-200 transition-all"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleSaveAmenity((selectedAmenity.id || '').toString())}
                  className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
                >
                  <Heart className={`h-5 w-5 ${
                    savedAmenities.includes((selectedAmenity.id || '').toString()) ? 'text-red-500 fill-current' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playing bar (shows when tour is active) */}
      {isPlaying && amenities.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <img 
              src={amenities[currentPlayingIndex]?.image_url || ''} 
              alt=""
              className="w-14 h-14 rounded"
            />
            <div className="flex-1">
              <p className="font-semibold">{amenities[currentPlayingIndex]?.name}</p>
              <p className="text-sm text-gray-400">Now navigating • {currentPlayingIndex + 1} of {amenities.length}</p>
            </div>
            <button 
              onClick={() => setCurrentPlayingIndex(Math.max(0, currentPlayingIndex - 1))}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={handlePlayCollection}
              className="p-3 bg-white rounded-full text-black"
            >
              <Pause className="h-5 w-5" fill="currentColor" />
            </button>
            <button 
              onClick={() => setCurrentPlayingIndex(Math.min(amenities.length - 1, currentPlayingIndex + 1))}
              className="p-2"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;

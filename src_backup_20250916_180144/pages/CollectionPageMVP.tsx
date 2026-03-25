// src/pages/CollectionPageMVP.tsx
// Collection page with consistent aesthetic to VibesFeedMVP

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, DollarSign, Users, Sparkles, ChevronRight, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getVibeBadge, shouldHighlightVibe } from '@/utils/getOptimalVibeOrder';
import { getBoardingStatus } from '@/utils/getBoardingStatus';

// Vibe configuration matching VibesFeedMVP
const VIBE_CONFIG = {
  comfort: {
    icon: '👑',
    name: 'Comfort',
    description: 'Premium lounges & rest',
    gradient: 'from-purple-500 to-indigo-500'
  },
  chill: {
    icon: '😌',
    name: 'Chill',
    description: 'Quiet, peaceful spaces',
    gradient: 'from-blue-400 to-cyan-400'
  },
  refuel: {
    icon: '🍔',
    name: 'Refuel',
    description: 'Food & drinks',
    gradient: 'from-orange-400 to-red-400'
  },
  work: {
    icon: '💼',
    name: 'Work',
    description: 'Productivity zones',
    gradient: 'from-gray-500 to-gray-700'
  },
  shop: {
    icon: '🛍️',
    name: 'Shop',
    description: 'Retail therapy',
    gradient: 'from-pink-400 to-purple-400'
  },
  quick: {
    icon: '⚡',
    name: 'Quick',
    description: 'Time-pressed options',
    gradient: 'from-yellow-400 to-amber-400'
  },
  discover: {
    icon: '🧭',
    name: 'Discover',
    description: 'Unique experiences',
    gradient: 'from-green-400 to-teal-400'
  }
};

// Collection keywords for better matching
const COLLECTION_KEYWORDS: { [key: string]: string[] } = {
  // Quick collections
  'quick-bites': ['fast food', 'quick', 'grab', 'express', 'takeaway', 'mcdonald', 'subway'],
  '24-7-heroes': ['24 hours', '24/7', 'overnight', 'late night', 'early morning'],
  'gate-essentials': ['convenience', 'essentials', 'pharmacy', 'store'],
  '2-minute-stops': ['quick', 'fast', 'express', 'grab'],
  
  // Refuel collections
  'local-food-real-prices': ['local', 'hawker', 'kopitiam', 'singapore', 'asian', 'cheap'],
  'local-eats': ['local', 'hawker', 'kopitiam', 'singapore', 'asian'],
  'coffee-worth-walk': ['coffee', 'cafe', 'starbucks', 'coffee bean', 'espresso'],
  'hawker-heaven': ['hawker', 'food court', 'local food', 'street food'],
  'breakfast-champions': ['breakfast', 'morning', 'brunch', 'eggs'],
  'dinner-delights': ['dinner', 'restaurant', 'dining'],
  
  // Shop collections
  'duty-free-deals': ['duty free', 'shop', 'retail', 'boutique', 'store'],
  'singapore-exclusives': ['singapore', 'souvenir', 'gift', 'local'],
  'last-minute-gifts': ['gift', 'souvenir', 'present'],
  'local-treasures': ['local', 'craft', 'artisan', 'souvenir'],
  
  // Comfort collections
  'lounge-life': ['lounge', 'vip', 'premium', 'first class', 'business class'],
  'sleep-pods': ['sleep', 'rest', 'nap', 'snooze'],
  'spa-wellness': ['spa', 'massage', 'wellness', 'relax'],
  'post-red-eye-recovery': ['shower', 'refresh', 'rest'],
  
  // Chill collections
  'hidden-quiet-spots': ['quiet', 'peaceful', 'rest', 'relax', 'calm'],
  'peaceful-corners': ['quiet', 'peaceful', 'calm', 'serene'],
  'gardens-at-dawn': ['garden', 'nature', 'outdoor'],
  'garden-paradise': ['garden', 'butterfly', 'sunflower', 'orchid'],
  
  // Work collections
  'work-spots-real-wifi': ['work', 'business', 'wifi', 'laptop', 'meeting'],
  'meeting-ready-spaces': ['meeting', 'conference', 'business'],
  'stay-connected': ['wifi', 'internet', 'charging'],
  'quiet-zones': ['quiet', 'study', 'work'],
  
  // Discover collections
  'only-at-changi': ['unique', 'exclusive', 'changi', 'special', 'attraction'],
  'instagram-worthy-spots': ['photo', 'instagram', 'scenic', 'view', 'art'],
  'hidden-gems': ['hidden', 'secret', 'unique', 'special'],
  'jewel-experience': ['jewel', 'waterfall', 'canopy', 'forest']
};

interface Amenity {
  id: number;
  name: string;
  amenity_slug: string;
  description: string;
  terminal_code: string;
  price_level: string;
  walking_time_minutes?: number;
  opening_hours?: string;
  zone?: string;
  crowd_level?: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
}

export const CollectionPageMVP: React.FC = () => {
  const { vibe, collectionSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [collection, setCollection] = useState<any>(null);
  const [boardingTime] = useState<number | undefined>(Date.now() + 2 * 60 * 60 * 1000);
  const [error, setError] = useState<string | null>(null);

  const vibeKey = vibe || 'refuel';
  const vibeConfig = VIBE_CONFIG[vibeKey as keyof typeof VIBE_CONFIG] || VIBE_CONFIG.refuel;
  const boardingStatus = getBoardingStatus(boardingTime);

  // Helper function to fetch amenities for a collection using proper database relationships
  const getAmenitiesForCollection = async (slug: string) => {
    console.log(`Fetching amenities for collection slug: ${slug}`);
    
    try {
      // First, get the collection ID from the slug
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('id, collection_id')
        .eq('collection_id', slug)
        .single();
      
      console.log('Collection lookup by slug:', {
        slug,
        collectionData,
        collectionError
      });
      
      if (collectionError || !collectionData) {
        console.log('Collection not found by slug, checking for UUID match...');
        
        // Try treating the slug as a direct UUID
        const { data: collectionByUuid } = await supabase
          .from('collections')
          .select('id')
          .eq('id', slug)
          .single();
          
        if (!collectionByUuid) {
          console.log('No collection found with slug or ID:', slug);
          return await getFallbackAmenities(slug);
        }
      }

      const collectionUuid = collectionData?.id;
      console.log(`Found collection UUID: ${collectionUuid} for slug: ${slug}`);
      
      if (!collectionUuid) {
        console.log('No UUID found, falling back to keyword search');
        return await getFallbackAmenities(slug);
      }

      // First, let's check if any amenities exist for this collection
      const { data: amenityCheck, error: checkError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id')
        .eq('collection_id', collectionUuid)
        .limit(5);
      
      console.log('Quick amenity check:', {
        collectionUuid,
        amenityIds: amenityCheck?.map(a => a.amenity_detail_id),
        checkError
      });

      // Now get the amenity IDs from collection_amenities
      const { data: collectionAmenities, error: caError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id, priority, is_featured')
        .eq('collection_id', collectionUuid)
        .order('priority', { ascending: true })
        .limit(50);
      
      console.log('Collection amenities query result:', { 
        collectionUuid,
        slug, 
        error: caError, 
        count: collectionAmenities?.length 
      });

      if (!caError && collectionAmenities && collectionAmenities.length > 0) {
        // Extract amenity IDs
        const amenityIds = collectionAmenities.map(ca => ca.amenity_detail_id);
        console.log('Fetching amenity details for IDs:', amenityIds);
        
        // Now fetch the actual amenity details
        const { data: amenities, error: amenitiesError } = await supabase
          .from('amenity_detail')
          .select('*')
          .in('id', amenityIds);
        
        if (!amenitiesError && amenities && amenities.length > 0) {
          console.log(`Found ${amenities.length} amenities via collection_amenities table`);
          return amenities;
        }
      }

      // If no amenities found, use fallback
      return await getFallbackAmenities(slug);
      
    } catch (error) {
      console.error('Error fetching amenities:', error);
      return await getFallbackAmenities(slug);
    }
  };

  // Fallback function for when no direct relationships exist
  const getFallbackAmenities = async (slug: string) => {
    console.log(`Using fallback for collection: ${slug}`);
    console.log('This might mean the collection_amenities table needs proper UUID relationships.');
    
    // Use keyword matching if no direct relationships exist
    const keywords = COLLECTION_KEYWORDS[slug] || [slug.replace(/-/g, ' ')];
    const orConditions = keywords.map(keyword => 
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%`
    ).join(',');

    // Search by keywords in SIN terminals
    const { data: keywordAmenities, error: kwError } = await supabase
      .from('amenity_detail')
      .select('*')
      .or(orConditions)
      .in('terminal_code', ['T1', 'T2', 'T3', 'T4', 'SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'])
      .limit(30);

    if (!kwError && keywordAmenities && keywordAmenities.length > 0) {
      console.log(`Found ${keywordAmenities.length} amenities via keyword search`);
      return keywordAmenities;
    }

    // Final fallback: Get amenities from SIN T3
    console.log('Using final fallback - getting amenities from SIN-T3');
    const { data: fallbackAmenities } = await supabase
      .from('amenity_detail')
      .select('*')
      .or('terminal_code.eq.SIN-T3,terminal_code.eq.T3')
      .limit(20);
      
    return fallbackAmenities || [];
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Fetch collection details
        const { data: collectionData } = await supabase
          .from('collections')
          .select('*')
          .eq('collection_id', collectionSlug)
          .single();

        setCollection(collectionData);

        // Fetch amenities for this collection using the collection ID
        const amenitiesData = await getAmenitiesForCollection(collectionSlug || '');
        console.log(`Loaded ${amenitiesData.length} amenities for collection: ${collectionSlug}`);
        setAmenities(amenitiesData);
        
      } catch (error: any) {
        console.error('Error loading collection:', error);
        setError(error?.message || 'Failed to load collection data');
      }

      setLoading(false);
    };

    loadData();
  }, [collectionSlug, vibeKey]);

  // Get crowd level color
  const getCrowdLevelColor = (level: string | undefined) => {
    switch(level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get price level display
  const getPriceLevelDisplay = (level: string) => {
    if (!level) return '💰';
    if (level.includes('$$$')) return '💰💰💰';
    if (level.includes('$$')) return '💰💰';
    if (level.includes('$')) return '💰';
    if (level.toLowerCase().includes('free')) return 'Free';
    return level;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Collection</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Show message if no amenities found
  if (amenities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${vibeConfig.gradient} text-white p-6`}>
          <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-3xl font-bold">{collection?.name || collectionSlug?.replace(/-/g, ' ')}</h1>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4">No amenities found for this collection yet.</p>
          <p className="text-sm text-gray-500">Try browsing other collections or check back later.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with gradient background */}
      <div className={`relative bg-gradient-to-br ${vibeConfig.gradient} text-white`}>
        <div className="px-4 py-6">
          {/* Navigation */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>

          {/* Collection Info */}
          <div className="flex items-start space-x-4">
            <span className="text-5xl">{vibeConfig.icon}</span>
            <div className="flex-1">
              <p className="text-white/80 text-sm mb-1">{vibeConfig.name} Collection</p>
              <h1 className="text-3xl font-bold mb-2">
                {collection?.name || collectionSlug?.replace(/-/g, ' ')}
              </h1>
              <p className="text-white/90">
                {collection?.description || `Discover the best ${vibeConfig.name.toLowerCase()} spots`}
              </p>
              
              {/* Stats */}
              <div className="flex items-center space-x-4 mt-4 text-white/80 text-sm">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {amenities.length} spots
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Updated today
                </span>
                <span className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI-curated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
            All ({amenities.length})
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">
            Near Gate
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">
            Open Now
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">
            Low Crowds
          </button>
        </div>
      </div>

      {/* Amenities List */}
      <div className="px-4 py-4 space-y-3">
        {amenities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No amenities found</h3>
            <p className="text-gray-600 mb-6">We're still curating this collection. Try browsing by vibe instead!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          amenities.map((amenity, index) => (
          <button
            key={amenity.id}
            onClick={() => navigate(`/amenity/${amenity.amenity_slug}`)}
            className="w-full bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-4 group"
          >
            <div className="flex items-start space-x-4">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${vibeConfig.gradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                      {amenity.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {amenity.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </div>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {/* Location & Walk Time */}
                  <div className="flex items-center space-x-2 text-xs">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      {amenity.terminal_code} {amenity.zone && `• ${amenity.zone}`}
                    </span>
                  </div>

                  {/* Walking Time */}
                  {amenity.walking_time_minutes && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">
                        {amenity.walking_time_minutes} min walk
                      </span>
                    </div>
                  )}

                  {/* Price Level */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-600">
                      {getPriceLevelDisplay(amenity.price_level)}
                    </span>
                  </div>

                  {/* Crowd Level */}
                  {amenity.crowd_level && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCrowdLevelColor(amenity.crowd_level)}`}>
                        {amenity.crowd_level} crowds
                      </span>
                    </div>
                  )}
                </div>

                {/* Rating if available */}
                {amenity.rating && (
                  <div className="flex items-center space-x-2 mt-2 text-xs">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-gray-700 font-medium ml-1">
                        {amenity.rating.toFixed(1)}
                      </span>
                    </div>
                    {amenity.review_count && (
                      <span className="text-gray-500">
                        ({amenity.review_count} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Special Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {amenity.opening_hours?.includes('24') && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      24/7
                    </span>
                  )}
                  {boardingStatus === 'rush' && amenity.walking_time_minutes && amenity.walking_time_minutes <= 3 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      ⚡ Quick Access
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
          ))
        )}
      </div>

      {/* Bottom Spacing */}
      <div className="h-20" />

      {/* Floating Action Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        <ArrowLeft className="h-5 w-5 rotate-90" />
      </button>
    </div>
  );
};

export default CollectionPageMVP;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Star, Navigation, ChevronDown, ChevronLeft, Share2, Heart, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AccessPoint {
  terminal_code: string;
  terminal_display: string;
  walking_time: string;
  level?: string;
  near_gate?: string;
  is_primary: boolean;
}

interface AmenityDetail {
  id: string;
  name: string;
  amenity_slug: string;
  description: string;
  category?: string;
  terminal_code: string;
  airport_code: string;
  price_level?: string;
  rating?: number;
  review_count?: number;
  opening_hours?: string;
  image_url?: string;
  logo_url?: string;
  vibe_tags?: string | string[];
  website_url?: string;
  // Multi-access specific
  has_multiple_access?: boolean;
  access_points?: AccessPoint[];
  price_tier?: string; // Added for new price display logic
}

const AmenityDetailPage: React.FC = () => {
  const { amenitySlug, terminalCode } = useParams<{ amenitySlug: string; terminalCode: string }>();
  const navigate = useNavigate();
  const [amenity, setAmenity] = useState<AmenityDetail | null>(null);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [isAccessExpanded, setIsAccessExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmenityDetails();
  }, [amenitySlug, terminalCode]);

  const fetchAmenityDetails = async () => {
    if (!amenitySlug) return;
    
    setLoading(true);
    try {
      // First, get the main amenity details
      const { data: amenityData, error: amenityError } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', amenitySlug)
        .single();

      if (amenityError || !amenityData) {
        console.error('Error fetching amenity:', amenityError);
        setLoading(false);
        return;
      }

      // Check if this amenity has multiple access points
      const { data: allAccessPoints, error: accessError } = await supabase
        .from('amenity_detail')
        .select('terminal_code, airport_code')
        .eq('name', amenityData.name)
        .eq('airport_code', amenityData.airport_code);

      if (!accessError && allAccessPoints && allAccessPoints.length > 1) {
        // This amenity has multiple access points
        const formattedAccessPoints = allAccessPoints.map(ap => ({
          terminal_code: ap.terminal_code,
          terminal_display: formatTerminalDisplay(ap.terminal_code),
          walking_time: estimateWalkingTime(terminalCode || '', ap.terminal_code),
          level: getTerminalLevel(ap.terminal_code),
          near_gate: getTerminalGate(ap.terminal_code),
          is_primary: ap.terminal_code === amenityData.terminal_code
        }));

        setAccessPoints(formattedAccessPoints);
        setAmenity({
          ...amenityData,
          has_multiple_access: true,
          access_points: formattedAccessPoints
        });
      } else {
        setAmenity({
          ...amenityData,
          has_multiple_access: false
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTerminalDisplay = (code: string): string => {
    if (!code) return 'Unknown';
    if (code.includes('JEWEL')) return 'Jewel (Main Entrance)';
    if (code.includes('T1')) return 'Terminal 1';
    if (code.includes('T2')) return 'Terminal 2';
    if (code.includes('T3')) return 'Terminal 3';
    if (code.includes('T4')) return 'Terminal 4';
    return code.replace('SIN-', '').replace('SYD-', '').replace('LHR-', '');
  };

  const formatTerminalBadge = (code: string): string => {
    if (!code) return '✈️';
    if (code.includes('JEWEL')) return '💎';
    if (code.includes('T1')) return '1️⃣';
    if (code.includes('T2')) return '2️⃣';
    if (code.includes('T3')) return '3️⃣';
    if (code.includes('T4')) return '4️⃣';
    return '✈️';
  };

  const estimateWalkingTime = (from: string, to: string): string => {
    if (!from || !to) return '5-10 min walk';
    if (from === to) return 'You are here';
    
    // Special handling for Jewel
    if (from.includes('JEWEL') || to.includes('JEWEL')) {
      return '5-10 min walk';
    }
    
    // Terminal to terminal
    const fromNum = parseInt(from.match(/T(\d)/)?.[1] || '0');
    const toNum = parseInt(to.match(/T(\d)/)?.[1] || '0');
    const diff = Math.abs(fromNum - toNum);
    
    if (diff === 0) return '2-3 min walk';
    if (diff === 1) return '5-7 min walk';
    if (diff === 2) return '8-10 min walk';
    return '10-15 min walk';
  };

  const getTerminalLevel = (code: string): string => {
    if (code.includes('JEWEL')) return 'Level 5';
    if (code.includes('T1')) return 'Level 2';
    if (code.includes('T2')) return 'Level 2';
    if (code.includes('T3')) return 'Level 2';
    if (code.includes('T4')) return 'Level 2';
    return '';
  };

  const getTerminalGate = (code: string): string => {
    if (code.includes('JEWEL')) return 'Central Area';
    if (code.includes('T1')) return 'Near Gate D';
    if (code.includes('T2')) return 'Near Gate E';
    if (code.includes('T3')) return 'Near Gate A';
    if (code.includes('T4')) return 'Near Gate G';
    return '';
  };

  const getPriceDisplay = (level?: string): string => {
    if (!level || level === '') return 'Free';
    const count = level.length;
    return ''.padStart(Math.min(count, 4), '$');
  };

  const formatVibeTags = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    if (typeof tags === 'string') {
      // Handle string format like "{Explore,Chill}"
      return tags.replace(/[{}]/g, '').split(',').filter(Boolean);
    }
    return tags;
  };

  const handleShare = async () => {
    if (navigator.share && amenity) {
      try {
        await navigator.share({
          title: amenity.name,
          text: amenity.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amenity details...</p>
        </div>
      </div>
    );
  }

  if (!amenity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Amenity not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Amenity Details</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-purple-500 to-pink-500">
        {amenity.image_url ? (
          <img 
            src={amenity.image_url} 
            alt={amenity.name}
            className="w-full h-full object-cover"
          />
        ) : amenity.logo_url ? (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={amenity.logo_url} 
              alt={amenity.name}
              className="w-32 h-32 object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">✨</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Category Badge */}
        {amenity.category && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
            <span className="text-white text-sm font-medium">{amenity.category}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-6 relative">
        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{amenity.name}</h2>
              
              {/* Vibe Tags */}
              {amenity.vibe_tags && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {formatVibeTags(amenity.vibe_tags).map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-gray-600 text-sm">{amenity.description}</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900">
                  {amenity.rating || '4.5'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {(amenity.review_count || 0).toLocaleString()} reviews
              </span>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 mb-1">
                {(() => {
                  const price = amenity.price_tier || amenity.price_level;
                  if (!price || price === '' || price.toLowerCase() === 'free') {
                    return <span className="text-green-600">Free</span>;
                  }
                  return (
                    <span className="flex items-center justify-center gap-1">
                      <span>$</span>
                      <span>{price}</span>
                    </span>
                  );
                })()}
              </div>
              <span className="text-xs text-gray-500">Entry</span>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 mb-1">
                {amenity.opening_hours ? amenity.opening_hours.split('-')[0].trim() : 'Open'}
              </div>
              <span className="text-xs text-gray-500">Opens</span>
            </div>
          </div>
        </div>

        {/* MULTI-ACCESS BADGE - Only shows for amenities with multiple access points */}
        {amenity.has_multiple_access && accessPoints.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4 overflow-hidden">
            <div 
              onClick={() => setIsAccessExpanded(!isAccessExpanded)}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Accessible from {accessPoints.length} locations
                    </p>
                    <p className="text-white/80 text-sm">
                      {accessPoints.map(ap => formatTerminalBadge(ap.terminal_code)).join(' ')}
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-white transition-transform ${isAccessExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
            
            {/* Expanded Access Points */}
            {isAccessExpanded && (
              <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
                <div className="p-4 space-y-3">
                  {accessPoints.map((point, idx) => (
                    <div 
                      key={idx}
                      className={`bg-white/10 backdrop-blur-sm rounded-xl p-3 ${
                        point.is_primary ? 'border border-white/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{formatTerminalBadge(point.terminal_code)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">
                                {point.terminal_display}
                              </p>
                              {point.is_primary && (
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                                  Main
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-white/80 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {point.walking_time}
                              </span>
                              {point.level && (
                                <span className="text-white/80 text-xs">
                                  {point.level}
                                </span>
                              )}
                              {point.near_gate && (
                                <span className="text-white/80 text-xs">
                                  {point.near_gate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                          <Navigation className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Standard Information Cards - Same for all amenities */}
        {/* Location Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatTerminalDisplay(amenity.terminal_code)}
                </p>
                <p className="text-sm text-gray-500">
                  {amenity.has_multiple_access ? 'Primary location' : 'Single location'}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all">
              Navigate
            </button>
          </div>
        </div>

        {/* Opening Hours Card */}
        {amenity.opening_hours && (
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Opening Hours</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{amenity.opening_hours}</p>
                <p className="text-sm text-green-600">Open now</p>
              </div>
            </div>
          </div>
        )}

        {/* Website Link */}
        {amenity.website_url && (
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <a 
              href={amenity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between hover:bg-gray-50 -m-2 p-2 rounded-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Visit Website</p>
                  <p className="text-sm text-gray-500">Learn more</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </a>
          </div>
        )}

        {/* Tips Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-20">
          <h3 className="font-semibold text-gray-900 mb-3">Tips</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">
                {amenity.has_multiple_access 
                  ? "This attraction can be accessed from multiple terminals. Choose the most convenient entrance based on your location."
                  : "Best visited during off-peak hours for a better experience."}
              </p>
            </div>
            {amenity.airport_code === 'SIN' && amenity.name.includes('Rain Vortex') && (
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Light & Sound show happens every hour from 7:30 PM to 10:30 PM.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmenityDetailPage;
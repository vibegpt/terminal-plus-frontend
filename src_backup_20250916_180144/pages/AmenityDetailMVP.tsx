// src/pages/AmenityDetailMVP.tsx
// Amenity detail page with consistent aesthetic to VibesFeedMVP

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, DollarSign, Users, Star, 
  Wifi, Coffee, Zap, Phone, Globe, ChevronRight,
  Info, Calendar, Navigation, Heart, Share2, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AmenityDetail {
  id: number;
  name: string;
  amenity_slug: string;
  description: string;
  terminal_code: string;
  airport_code: string;
  price_level: string;
  walking_time_minutes?: number;
  opening_hours?: string;
  zone?: string;
  gate_location?: string;
  crowd_level?: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
  website_url?: string;
  phone?: string;
  vibe_tags?: string;
  amenities_offered?: string[];
  payment_methods?: string[];
  accessibility_features?: string[];
}

// Helper to determine vibe gradient from tags
const getVibeGradient = (vibeTags?: string): string => {
  if (!vibeTags) return 'from-blue-500 to-purple-600';
  
  const tags = vibeTags.toLowerCase();
  if (tags.includes('comfort') || tags.includes('lounge')) return 'from-purple-500 to-indigo-500';
  if (tags.includes('chill') || tags.includes('relax')) return 'from-blue-400 to-cyan-400';
  if (tags.includes('refuel') || tags.includes('food')) return 'from-orange-400 to-red-400';
  if (tags.includes('work') || tags.includes('business')) return 'from-gray-500 to-gray-700';
  if (tags.includes('shop')) return 'from-pink-400 to-purple-400';
  if (tags.includes('quick')) return 'from-yellow-400 to-amber-400';
  if (tags.includes('discover')) return 'from-green-400 to-teal-400';
  
  return 'from-blue-500 to-purple-600';
};

const getVibeIcon = (vibeTags?: string): string => {
  if (!vibeTags) return '✨';
  
  const tags = vibeTags.toLowerCase();
  if (tags.includes('comfort') || tags.includes('lounge')) return '👑';
  if (tags.includes('chill') || tags.includes('relax')) return '😌';
  if (tags.includes('refuel') || tags.includes('food')) return '🍔';
  if (tags.includes('work') || tags.includes('business')) return '💼';
  if (tags.includes('shop')) return '🛍️';
  if (tags.includes('quick')) return '⚡';
  if (tags.includes('discover')) return '🧭';
  
  return '✨';
};

export const AmenityDetailMVP: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [amenity, setAmenity] = useState<AmenityDetail | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const loadAmenityData = async () => {
      setLoading(true);

      // Fetch amenity details
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', slug)
        .single();

      if (!error && data) {
        setAmenity(data);
      }

      setLoading(false);
    };

    loadAmenityData();
  }, [slug]);

  // Parse opening hours
  const parseOpeningHours = (hours?: string): { today: string; fullWeek: string[] } => {
    if (!hours) return { today: 'Hours not available', fullWeek: [] };
    
    // Simple parsing - you can make this more sophisticated
    if (hours.includes('24')) {
      return { 
        today: 'Open 24/7', 
        fullWeek: ['Mon-Sun: Open 24 hours'] 
      };
    }
    
    // Default
    return { 
      today: hours, 
      fullWeek: [hours] 
    };
  };

  // Get price display
  const getPriceDisplay = (level?: string): { symbol: string; label: string } => {
    if (!level) return { symbol: '💰', label: 'Price varies' };
    if (level.toLowerCase().includes('free')) return { symbol: 'Free', label: 'No cost' };
    if (level.includes('$$$')) return { symbol: '💰💰💰', label: 'Premium' };
    if (level.includes('$$')) return { symbol: '💰💰', label: 'Moderate' };
    if (level.includes('$')) return { symbol: '💰', label: 'Budget-friendly' };
    return { symbol: level, label: 'See details' };
  };

  // Get crowd color
  const getCrowdColor = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!amenity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Amenity not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const vibeGradient = getVibeGradient(amenity.vibe_tags);
  const vibeIcon = getVibeIcon(amenity.vibe_tags);
  const priceInfo = getPriceDisplay(amenity.price_level);
  const hoursInfo = parseOpeningHours(amenity.opening_hours);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section with Image or Gradient */}
      <div className={`relative h-64 bg-gradient-to-br ${vibeGradient}`}>
        {amenity.image_url && (
          <img 
            src={amenity.image_url} 
            alt={amenity.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        
        {/* Navigation Bar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Amenity Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center space-x-3">
            <span className="text-5xl">{vibeIcon}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{amenity.name}</h1>
              <p className="text-white/80 mt-1">{amenity.terminal_code} • {amenity.zone || 'Terminal'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white px-4 py-3 grid grid-cols-4 gap-2 border-b border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Walk Time</p>
          <p className="text-sm font-semibold text-gray-900">
            {amenity.walking_time_minutes || '5'} min
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-sm font-semibold text-gray-900">{priceInfo.symbol}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Crowds</p>
          <p className={`text-sm font-semibold ${getCrowdColor(amenity.crowd_level).split(' ')[0]}`}>
            {amenity.crowd_level || 'Moderate'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Rating</p>
          <p className="text-sm font-semibold text-gray-900 flex items-center justify-center">
            <Star className="h-3 w-3 text-yellow-400 fill-current mr-0.5" />
            {amenity.rating?.toFixed(1) || '4.5'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Description */}
        <div>
          <h2 className="font-bold text-gray-900 mb-2">About</h2>
          <p className="text-gray-600 leading-relaxed">
            {amenity.description || 'Experience premium comfort and service at this location.'}
          </p>
        </div>

        {/* Location Details */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Location & Directions</h2>
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {amenity.terminal_code} - {amenity.gate_location || amenity.zone || 'Main Terminal'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {amenity.walking_time_minutes || '5'} minute walk from security
                </p>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
              <Navigation className="h-4 w-4" />
              <span>Get Directions</span>
            </button>
          </div>
        </div>

        {/* Opening Hours */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Opening Hours</h2>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Today</span>
              </div>
              <span className="text-green-600 font-medium">{hoursInfo.today}</span>
            </div>
            
            {hoursInfo.fullWeek.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {hoursInfo.fullWeek.map((hours, idx) => (
                  <p key={idx} className="text-sm text-gray-600">{hours}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amenities & Features */}
        {amenity.amenities_offered && amenity.amenities_offered.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center">
                <Wifi className="h-3 w-3 mr-1.5" />
                Free WiFi
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center">
                <Coffee className="h-3 w-3 mr-1.5" />
                Refreshments
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center">
                <Zap className="h-3 w-3 mr-1.5" />
                Charging Stations
              </span>
            </div>
          </div>
        )}

        {/* Contact & Website */}
        <div className="space-y-3">
          {amenity.website_url && (
            <a
              href={amenity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">Visit Website</span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          )}
          
          {amenity.phone && (
            <a
              href={`tel:${amenity.phone}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{amenity.phone}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
          )}
        </div>

        {/* Reviews Section (Placeholder) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Reviews</h2>
            <button className="text-blue-600 text-sm font-medium">
              See all {amenity.review_count || 24}
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center">
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i <= (amenity.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-900">
                {amenity.rating?.toFixed(1) || '4.5'} out of 5
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              Based on {amenity.review_count || 24} reviews
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button className={`w-full py-3 bg-gradient-to-r ${vibeGradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all`}>
          Add to My Journey
        </button>
      </div>

      {/* Bottom Padding for Fixed Bar */}
      <div className="h-24" />
    </div>
  );
};

export default AmenityDetailMVP;

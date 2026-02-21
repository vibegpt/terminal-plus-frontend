// src/pages/AmenityDetailAdaptiveLuxe.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Navigation, 
  Share2, 
  Heart,
  Phone,
  Globe,
  Info,
  ExternalLink,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlassCard, 
  GlassCardHeavy, 
  LiveBadge, 
  MiniMap, 
  Chip,
  LiveDot,
  GradientText,
  PageTransition,
  Skeleton
} from '@/components/AdaptiveLuxe';
import { supabase } from '@/lib/supabase';
import { getAmenitiesTable } from '@/config/database';
import '../styles/adaptive-luxe.css';

interface AmenityData {
  id: number;
  amenity_slug: string;
  name: string;
  description: string;
  terminal_code: string;
  airport_code: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: string;
  website_url: string | null;
  logo_url: string | null;
  booking_required: boolean;
  available_in_tr: boolean;
  created_at: string;
}

const AmenityDetailAdaptiveLuxe: React.FC = () => {
  const { terminalCode, amenitySlug } = useParams();
  const navigate = useNavigate();
  const [amenity, setAmenity] = useState<AmenityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Time-based theme
  const hour = new Date().getHours();
  const theme = hour >= 5 && hour < 12 ? 'morning' : 
                hour >= 12 && hour < 20 ? 'day' : 'night';
  
  // Fetch amenity details
  useEffect(() => {
    const fetchAmenity = async () => {
      setLoading(true);
      try {
        const slug = amenitySlug || terminalCode; // Handle both route patterns
        
        // Get the current table name dynamically
        const tableName = getAmenitiesTable();
        
        const { data, error } = await supabase
          .from(tableName) // Use dynamic table name
          .select('*')
          .eq('amenity_slug', slug)
          .single();

        if (error) {
          console.error('Error fetching from primary table:', error);
          
          // Try fallback tables if main table fails
          const fallbackTables = ['amenity_detail', 'amenities', 'syd_t1_new_dining_amenities'];
          
          for (const fallbackTable of fallbackTables) {
            try {
              const fallbackQuery = await supabase
                .from(fallbackTable)
                .select('*')
                .eq('amenity_slug', slug)
                .single();
              
              if (fallbackQuery.data) {
                console.log(`Found amenity in fallback table: ${fallbackTable}`);
                setAmenity(fallbackQuery.data);
                return;
              }
            } catch (fallbackError) {
              console.log(`Fallback table ${fallbackTable} not available`);
            }
          }
          
          // If no data found in any table
          setAmenity(null);
        } else {
          setAmenity(data);
        }
      } catch (error) {
        console.error('Error fetching amenity:', error);
        setAmenity(null);
      } finally {
        setLoading(false);
      }
    };

    if (amenitySlug || terminalCode) {
      fetchAmenity();
    }
  }, [amenitySlug, terminalCode]);
  
  // Set theme on body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'night' 
      ? 'linear-gradient(180deg, #0A0E27 0%, #1a1a2e 100%)'
      : theme === 'morning'
      ? 'linear-gradient(180deg, #FFE5E5 0%, #E5D4FF 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 100%)';
  }, [theme]);

  // Generate gradient for fallback
  const generateGradient = (name: string) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    return gradients[name.length % gradients.length];
  };

  // Get emoji based on vibe tags
  const getEmoji = (tags: string) => {
    if (tags?.includes('coffee') || tags?.includes('cafe')) return '☕';
    if (tags?.includes('food') || tags?.includes('restaurant')) return '🍽️';
    if (tags?.includes('shopping') || tags?.includes('shop')) return '🛍️';
    if (tags?.includes('lounge') || tags?.includes('relax')) return '💆';
    if (tags?.includes('bar') || tags?.includes('drink')) return '🍺';
    if (tags?.includes('fast')) return '🍔';
    return '✨';
  };

  // Parse opening hours
  const parseOpeningHours = (hours: string) => {
    if (!hours) return 'Hours not available';
    try {
      const parsed = JSON.parse(hours);
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return parsed[today] || hours;
    } catch {
      return hours;
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share && amenity) {
      try {
        await navigator.share({
          title: amenity.name,
          text: amenity.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-dark">
          {/* Header Skeleton */}
          <div className="sticky top-0 z-40 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center justify-between px-4 py-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
          
          {/* Hero Skeleton */}
          <Skeleton className="h-[50vh]" />
          
          {/* Content Skeleton */}
          <div className="px-4 py-6 space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!amenity) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Amenity not found</h2>
            <p className="text-white/60 mb-6">This amenity doesn't seem to exist</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gradient-primary rounded-full text-white font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const emoji = getEmoji(amenity.vibe_tags);
  const priceDisplay = amenity.price_level || '$';
  const vibes = amenity.vibe_tags?.split(',').map(v => v.trim()).filter(Boolean) || [];
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-dark">
        {/* Time indicator */}
        <div className="fixed top-4 right-4 z-50 glass-card px-4 py-2 text-xs text-white/70">
          {theme === 'morning' && '🌅 Morning Mode'}
          {theme === 'day' && '☀️ Day Mode'}
          {theme === 'night' && '🌙 Night Mode'}
        </div>
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            
            <h1 className="text-lg font-bold text-white truncate px-2">
              {amenity.name}
            </h1>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Share2 className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative h-[50vh] overflow-hidden">
          {/* Background Image or Gradient */}
          {amenity.logo_url && !imageError ? (
            <img
              src={amenity.logo_url}
              alt={amenity.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ background: generateGradient(amenity.name) }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-[#0A0E27]/50 to-transparent" />
          
          {/* Content Overlay */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-6"
          >
            <GlassCardHeavy className="p-6">
              <div className="flex items-start gap-4">
                <motion.div 
                  className="text-5xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {emoji}
                </motion.div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{amenity.name}</h1>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <LiveBadge status="success">Open Now</LiveBadge>
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Popular spot
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {amenity.terminal_code}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {priceDisplay}
                    </span>
                    {amenity.booking_required && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Booking required
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className="p-3 rounded-full hover:bg-white/10 transition-all"
                >
                  <Heart 
                    className={`h-6 w-6 ${
                      isSaved ? 'text-red-500 fill-current' : 'text-white/60'
                    }`} 
                  />
                </button>
              </div>
            </GlassCardHeavy>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                About
              </h2>
              <p className="text-white/80 leading-relaxed">
                {amenity.description || 'No description available.'}
              </p>
            </GlassCard>
          </motion.div>

          {/* Quick Info Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-white/60">Hours</p>
                  <p className="text-sm text-white font-medium">
                    {parseOpeningHours(amenity.opening_hours)}
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-white/60">Walk time</p>
                  <p className="text-sm text-white font-medium">~3 min</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Vibes */}
          {vibes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-white mb-3">Vibes</h3>
              <div className="flex flex-wrap gap-2">
                {vibes.map((vibe, index) => (
                  <Chip key={index} variant="secondary">
                    {vibe}
                  </Chip>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {amenity.website_url && (
              <GlassCard 
                className="p-4"
                onClick={() => window.open(amenity.website_url!, '_blank')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Visit Website</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/60" />
                </div>
              </GlassCard>
            )}
            
            <GlassCard 
              className="p-4"
              onClick={() => navigate(`/terminal/${amenity.terminal_code}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <span className="text-white">View on Map</span>
                </div>
                <Navigation className="h-4 w-4 text-white/60" />
              </div>
            </GlassCard>
          </motion.div>

          {/* Similar Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Similar Spots
            </h3>
            <div className="text-center py-8">
              <p className="text-white/60">More recommendations coming soon</p>
            </div>
          </motion.div>
        </div>

        {/* Floating Navigation Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary rounded-full shadow-2xl flex items-center justify-center z-20"
          onClick={() => navigate(`/terminal/${amenity.terminal_code}`)}
        >
          <MapPin className="h-6 w-6 text-white" />
        </motion.button>
      </div>
    </PageTransition>
  );
};

export default AmenityDetailAdaptiveLuxe;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Star, Navigation, Grid3X3, List } from 'lucide-react';
import { getCollectionsForVibe, COLLECTION_MAPPINGS } from '../constants/vibeDefinitions';
import '../styles/adaptive-luxe.css';

// Get theme based on time of day
const getTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'day';
  return 'night';
};

// Live status generator
const getLiveStatus = () => {
  const random = Math.random();
  if (random < 0.3) return { status: 'quiet', label: 'Quiet now', color: 'success' };
  if (random < 0.6) return { status: 'moderate', label: 'Getting busy', color: 'warning' };
  if (random < 0.9) return { status: 'busy', label: 'Busy', color: 'danger' };
  return { status: 'very-busy', label: 'Peak hours', color: 'danger' };
};

// Generate gradient for amenities without images
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

// Simplified version without framer-motion
export function CollectionDetailAdaptiveLuxe() {
  const { vibeSlug, collectionSlug } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [theme, setTheme] = useState(getTimeTheme());
  
  // Get collection info
  const collection = COLLECTION_MAPPINGS[vibeSlug as string]?.[collectionSlug as string];
  
  // Set theme on body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'night' 
      ? 'linear-gradient(180deg, #0A0E27 0%, #1a1a2e 100%)'
      : theme === 'morning'
      ? 'linear-gradient(180deg, #FFE5E5 0%, #E5D4FF 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 100%)';
    
    // Update theme based on time
    const interval = setInterval(() => {
      setTheme(getTimeTheme());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [theme]);
  
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'nearby', label: 'Near You' },
    { id: 'open', label: 'Open Now' },
    { id: 'quick', label: '< 5 min' },
    { id: 'rated', label: 'Top Rated' },
  ];

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Collection not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const filteredAmenities = collection.amenities.filter((amenity: string) => {
    if (activeFilter === 'all') return true;
    // Add filter logic here
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'inherit' }}>
      {/* Time indicator */}
      <div className="fixed top-4 right-4 z-50 glass-card px-4 py-2 text-xs text-white/70 rounded-full">
        {theme === 'morning' && '🌅 Morning Mode'}
        {theme === 'day' && '☀️ Day Mode'}
        {theme === 'night' && '🌙 Night Mode'}
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-white uppercase tracking-wider">
            {vibeSlug}
          </h1>
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {viewMode === 'list' ? 
              <Grid3X3 className="w-5 h-5 text-white" /> : 
              <List className="w-5 h-5 text-white" />
            }
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ background: collection.gradient || generateGradient(collection.name) }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27]/80 to-transparent" />
        </div>
        
        <div className="absolute bottom-8 left-6 right-6">
          <div className="glass-card-heavy p-6 rounded-[28px]">
            <div className="text-5xl mb-4">{collection.emoji}</div>
            <h1 className="text-3xl font-bold text-white mb-2">{collection.name}</h1>
            <p className="text-white/80 mb-4">{collection.subtitle}</p>
            
            <div className="flex gap-3 flex-wrap">
              <span className="luxe-chip luxe-chip-success">
                <span className="live-dot"></span>
                {collection.amenities?.length || 0} spots
              </span>
              <span className="luxe-chip">
                📍 5 nearby
              </span>
              <span className="luxe-chip luxe-chip-warning">
                🔥 3 trending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-[60px] z-30 glass-dark border-t border-white/10">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg'
                  : 'glass-card text-white/70 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenity Grid/List */}
      <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
        {filteredAmenities.map((amenity: string, index: number) => {
          const liveStatus = getLiveStatus();
          const amenityData = {
            name: amenity.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            terminal: 'T3',
            gate: 'Gate B',
            rating: 4.5,
            price: '$$',
            walkTime: Math.floor(Math.random() * 10) + 1,
            closeTime: '11pm',
            emoji: ['🍔', '☕', '🍜', '🛍️', '🎮', '💆', '🛏️'][Math.floor(Math.random() * 7)],
            ...liveStatus
          };

          if (viewMode === 'grid') {
            return (
              <div
                key={amenity}
                onClick={() => navigate(`/amenity/${amenity}`)}
                className="relative rounded-[24px] overflow-hidden bg-[#151B3B] border border-white/10 cursor-pointer gradient-border hover:transform hover:scale-105 transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <div 
                    className="w-full h-full flex items-center justify-center text-4xl"
                    style={{ background: generateGradient(amenityData.name) }}
                  >
                    {amenityData.emoji}
                  </div>
                  <div className="absolute top-3 right-3">
                    <div className="mini-map">
                      <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs font-semibold">
                        {amenityData.walkTime} min
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-2">{amenityData.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`luxe-chip luxe-chip-${liveStatus.color}`}>
                      <span className="live-dot"></span>
                      {liveStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={amenity}
              onClick={() => navigate(`/amenity/${amenity}`)}
              className="relative rounded-[24px] overflow-hidden bg-[#151B3B] border border-white/10 cursor-pointer gradient-border hover:transform hover:scale-105 transition-all"
            >
              <div className="h-48 relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <div 
                  className="w-full h-full flex items-center justify-center text-6xl"
                  style={{ background: generateGradient(amenityData.name) }}
                >
                  {amenityData.emoji}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27]/90 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <span className={`luxe-chip luxe-chip-${liveStatus.color}`}>
                    <span className="live-dot"></span>
                    {liveStatus.label}
                  </span>
                  <div className="mini-map">
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs font-semibold">
                      {amenityData.walkTime} min
                    </div>
                  </div>
                </div>
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-xl text-white mb-1">{amenityData.name}</h3>
                  <p className="text-white/70 text-sm mb-3">{amenityData.terminal}, {amenityData.gate}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="luxe-chip">⭐ {amenityData.rating}</span>
                    <span className="luxe-chip">💰 {amenityData.price}</span>
                    <span className="luxe-chip">🚶 {amenityData.walkTime} min</span>
                    <span className="luxe-chip luxe-chip-success">Open until {amenityData.closeTime}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating Action Button */}
      <button 
        className="fab"
        onClick={() => navigate(`/map/${collectionSlug}`)}
      >
        <MapPin className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

export default CollectionDetailAdaptiveLuxe;

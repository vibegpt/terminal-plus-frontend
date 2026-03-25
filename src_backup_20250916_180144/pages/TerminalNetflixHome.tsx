// src/pages/TerminalNetflixHome.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Info, Search, Home, Clipboard, User, MapPin } from 'lucide-react';
import { useVibeAmenities, useFeaturedContent } from '../hooks/useVibeAmenities';
import { VibeService } from '../services/VibeService';
import { isHiddenGemsFreeAmenity } from '../config/hiddenGemsFreeAmenities';

const TerminalNetflixHome: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  // Terminal configuration - this could come from user context or route params
  const terminalCode = 'SYD-T1';
  const airportCode = 'SYD';
  
  // Fetch real data
  const { vibesWithAmenities, vibeConfig, loading, error } = useVibeAmenities({
    terminalCode,
    airportCode,
    limitPerVibe: 10
  });
  
  const { featuredCollection, curatedCollections, loading: featuredLoading } = useFeaturedContent(
    terminalCode,
    airportCode
  );

  // Navigation handlers
  const handleCollectionClick = (collectionId: string) => {
    navigate(`/collection/${collectionId}`);
  };

  const handleAmenityClick = (amenitySlug: string) => {
    navigate(`/amenity/${amenitySlug}`);
  };

  const handleVibeViewAll = (vibe: string) => {
    navigate(`/vibe/${vibe.toLowerCase()}`);
  };

  if (loading || featuredLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your terminal experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading amenities</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: `
          radial-gradient(at 40% 20%, hsla(280,100%,74%,0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsla(355,100%,93%,0.2) 0px, transparent 50%),
          #0f172a
        `
      }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Terminal+
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {airportCode} • Terminal {terminalCode.split('-')[1]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-20">
        {/* Featured Collection Hero */}
        {featuredCollection && (
          <section className="relative h-[500px] -mt-20">
            <div className="absolute inset-0">
              <img 
                src={featuredCollection.image}
                alt={featuredCollection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            </div>
            
            <div className="relative h-full flex items-end px-4 pb-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-600 text-xs font-semibold rounded-full">
                    FEATURED COLLECTION
                  </span>
                  <span className="text-sm text-gray-300">Updated daily</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-3">
                  {featuredCollection.title}
                </h2>
                <p className="text-lg text-gray-200 mb-4">
                  {featuredCollection.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-300 mb-6">
                  <span>☕ {featuredCollection.spots} spots</span>
                  <span>•</span>
                  <span>⚡ High energy</span>
                  <span>•</span>
                  <span>📍 All terminals</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleCollectionClick(featuredCollection.id)}
                    className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" fill="currentColor" />
                    Explore Collection
                  </button>
                  <button className="px-6 py-3 bg-white/20 backdrop-blur font-semibold rounded-lg hover:bg-white/30 transition flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    More Info
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Curated Collections */}
        {curatedCollections.length > 0 && (
          <section className="px-4 py-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Curated Collections</h3>
              <button className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {curatedCollections.map(collection => (
                <div 
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="flex-none w-80 cursor-pointer transform transition hover:scale-105"
                >
                  <div className="relative h-44 rounded-lg overflow-hidden">
                    <img 
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-xs text-gray-300 mb-1">{collection.spots} spots</p>
                      <h4 className="text-lg font-semibold">{collection.title}</h4>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span 
                        className="px-2 py-1 text-xs rounded"
                        style={{ backgroundColor: collection.badgeColor }}
                      >
                        {collection.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vibe-Based Rows */}
        {/* Vibe-Based Rows - Mobile Optimized */}
        {Array.from(vibesWithAmenities.entries()).map(([vibe, amenities]) => {
          const vibeInfo = vibeConfig[vibe];
          if (!vibeInfo || amenities.length === 0) return null;

          return (
            <section key={vibe} className="px-4 py-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{vibeInfo.emoji}</span>
                <h3 className="text-xl font-semibold">{vibe}</h3>
                <span className="hidden sm:inline text-sm text-gray-400">{vibeInfo.description}</span>
                <button 
                  onClick={() => handleVibeViewAll(vibe)}
                  className="ml-auto text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Mobile-optimized scrolling container */}
              <div 
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch' // Smooth iOS scrolling
                }}
              >
                {amenities.map((amenity, index) => (
                  <div 
                    key={amenity.id}
                    className="
                      flex-none 
                      w-[82vw] sm:w-64 md:w-60 
                      snap-start snap-always
                      cursor-pointer transform transition hover:scale-105
                    "
                    onMouseEnter={() => setHoveredCard(amenity.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleAmenityClick(amenity.amenity_slug)}
                    style={{ willChange: 'transform' }} // Performance optimization
                  >
                    <div 
                      className="relative h-36 rounded-lg overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${vibeInfo.color}20, ${vibeInfo.color}10)`,
                        borderLeft: `3px solid ${vibeInfo.color}`
                      }}
                    >
                      {amenity.logo_url && (
                        <img 
                          src={amenity.logo_url}
                          alt={amenity.name}
                          className="w-full h-full object-cover opacity-90"
                          loading="lazy" // Lazy load images
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                          {amenity.name}
                        </h4>
                        {/* Simplified info for mobile */}
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="sm:hidden">
                            {(() => {
                              const price = amenity.price_level;
                              if (!price || price === '' || price.toLowerCase() === 'free') {
                                return <span className="text-green-400">Free</span>;
                              }
                              return <span>{price}</span>;
                            })()}
                          </span>
                          <span className="hidden sm:inline">
                            {(() => {
                              const price = amenity.price_level;
                              if (!price || price === '' || price.toLowerCase() === 'free') {
                                return (
                                  <>
                                    <span className="text-green-400">Free</span>
                                    <span>•</span>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <span>{price}</span>
                                  <span>•</span>
                                </>
                              );
                            })()}
                            <span>Terminal {terminalCode.split('-')[1]}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Desktop hover state only */}
                      {hoveredCard === amenity.id && (
                        <div className="hidden sm:flex absolute inset-0 bg-black/50 backdrop-blur-sm items-center justify-center">
                          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition">
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* End padding for last card */}
                <div className="flex-none w-4 sm:hidden" />
              </div>
              
              {/* Optional: Scroll indicators for mobile */}
              <div className="flex justify-center gap-1 mt-3 sm:hidden">
                {amenities.slice(0, 5).map((_, i) => (
                  <div 
                    key={i}
                    className="h-1 w-1 rounded-full bg-gray-500"
                  />
                ))}
                {amenities.length > 5 && (
                  <span className="text-xs text-gray-500 ml-1">+{amenities.length - 5}</span>
                )}
              </div>
            </section>
          );
        })}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-purple-800/30">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-white">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition">
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition">
            <Clipboard className="w-6 h-6" />
            <span className="text-xs mt-1">Journey</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-white transition">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default TerminalNetflixHome;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share, MoreHorizontal, Play, Sparkles, RefreshCw, MapPinIcon, Signal, ChevronLeft, ChevronRight, Heart, CheckCircle } from 'lucide-react';
import '../styles/changi-exclusives.css';
import { supabase } from '@/lib/supabase';

// Fixed component that actually displays the data
const TerminalBestOfPageFixed: React.FC = () => {
  const { terminalCode } = useParams<{ terminalCode: string }>();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Parse terminal code (e.g., "SIN-T3" -> airport: "SIN", terminal: "T3")
  const [airportCode, terminalNumber] = terminalCode?.split('-') || ['SIN', 'T3'];

  // Fetch collections with CORRECT data mapping
  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        console.log(`Fetching collections for ${airportCode} ${terminalNumber}`);
        
        // Direct RPC call
        const { data, error } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airportCode,
          p_terminal: terminalNumber
        });
        
        if (error) {
          console.error('Error:', error);
          setLoading(false);
          return;
        }
        
        console.log('RPC Data received:', data);
        setCollections(data || []);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, [airportCode, terminalNumber]);

  const handleBack = () => navigate(-1);
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      const currentScroll = carouselRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="relative px-6 pt-16 pb-8">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            className="p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="text-sm text-gray-300">
            {airportCode === 'SIN' ? 'Singapore Changi' : 
             airportCode === 'SYD' ? 'Sydney Airport' : 
             airportCode} Terminal {terminalNumber}
          </div>
        </div>

        {/* Hero */}
        <div className="flex items-end gap-6 mb-8">
          <div className="w-56 h-56 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4" />
              <div className="font-bold text-xl mb-1">BEST OF</div>
              <div className="text-2xl font-bold">{terminalCode}</div>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {airportCode === 'SIN' ? 'Singapore Changi' : 
               airportCode === 'SYD' ? 'Sydney Airport' : 
               airportCode}
            </h1>
            <p className="text-xl opacity-90">
              Your curated guide to Terminal {terminalNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Collections Section */}
      <div className="px-6 pb-12">
        <h2 className="text-2xl font-bold mb-6">Smart Collections</h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2">Loading collections...</span>
          </div>
        ) : (
          <div className="relative">
            {/* Scroll buttons */}
            <button
              onClick={() => scrollCarousel('left')}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={() => scrollCarousel('right')}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/70"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Collections Carousel */}
            <div 
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {collections.map((col) => {
                const isSaved = savedItems.includes(col.collection_slug);
                
                return (
                  <div 
                    key={col.collection_uuid}
                    onClick={() => navigate(`/collection/${terminalCode}/${col.collection_slug}`)}
                    className="flex-none w-80 snap-start"
                  >
                    <div className="changi-exclusives-card gradient-animate h-full rounded-2xl transition-all cursor-pointer hover:scale-[1.02] group">
                      <div className="glass-overlay p-6 h-full">
                      {/* Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`w-20 h-20 bg-gradient-to-r ${col.gradient || 'from-blue-500 to-purple-500'} rounded-xl flex items-center justify-center text-3xl shadow-lg`}>
                          {col.icon || '📍'}
                          {col.featured && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              LIVE
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-bold text-lg mb-1 text-center">
                        {col.collection_name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-3 text-center">
                        {col.description || 'Curated experiences'}
                      </p>
                      
                      {/* THE CRITICAL PART - Display actual counts from RPC */}
                      <div className="bg-white/10 rounded-lg p-3 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {col.spots_total || 0}
                          </div>
                          <div className="text-xs text-gray-400">spots total</div>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                          <div>
                            <span className="text-sm font-semibold text-blue-400">
                              {col.spots_near_you || 0}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">near you</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">
                              in Terminal {terminalNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedItems(prev => 
                              prev.includes(col.collection_slug)
                                ? prev.filter(id => id !== col.collection_slug)
                                : [...prev, col.collection_slug]
                            );
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isSaved 
                              ? 'text-green-500 bg-green-500/20' 
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {isSaved ? <CheckCircle className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                        </button>
                        
                        <button className="px-4 py-2 bg-green-500 text-black rounded-full flex items-center gap-2 hover:scale-110 transition-all font-semibold text-sm">
                          Explore
                          <Play className="h-4 w-4" fill="currentColor" />
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Debug Panel - Remove in production */}
        {collections.length > 0 && (
          <div className="mt-8 p-4 bg-black/50 rounded-lg">
            <h3 className="text-sm font-bold mb-2">Debug: Raw Data</h3>
            <div className="text-xs text-gray-400">
              {collections.slice(0, 2).map(col => (
                <div key={col.collection_uuid} className="mb-2">
                  {col.collection_name}: {col.spots_total} total, {col.spots_near_you} near
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalBestOfPageFixed;
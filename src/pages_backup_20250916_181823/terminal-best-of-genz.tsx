import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, X, MapPin, Clock, Sparkles, ChevronRight,
  Coffee, ShoppingBag, Zap, Baby, Gem
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Terminal {
  name: string;
  count: number;
  pulse?: boolean;
}

interface Collection {
  id: string;
  collection_id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  count?: number;
  featured?: boolean;
  terminals?: Terminal[];
  previews?: string[];
  attractions?: any[];
}

const TerminalBestOfGenZ: React.FC = () => {
  const { terminalCode } = useParams<{ terminalCode: string }>();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  // Parse terminal code (e.g., "SIN-T3" -> airport: "SIN", terminal: "T3")
  const [airportCode, terminalNumber] = terminalCode?.split('-') || ['SIN', 'T3'];

  // Animation trigger
  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        console.log(`Fetching collections for ${airportCode} ${terminalNumber}`);
        
        // Get collections data
        const { data, error } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airportCode,
          p_terminal: terminalNumber
        });
        
        if (error) {
          console.error('Error:', error);
          setLoading(false);
          return;
        }
        
        // Transform data for our needs
        const transformedCollections: Collection[] = (data || []).map((col: any) => ({
          id: col.id,
          collection_id: col.collection_id,
          name: col.name,
          emoji: col.icon || '✨',
          description: col.description,
          gradient: col.gradient || 'from-purple-500 to-pink-500',
          count: col.amenity_count || 0,
          featured: col.featured || false
        }));

        // Special handling for Changi Exclusives
        const changiExclusives = transformedCollections.find(c => 
          c.collection_id === 'changi-exclusives' || 
          c.name.toLowerCase().includes('changi exclusive')
        );
        
        if (changiExclusives && airportCode === 'SIN') {
          changiExclusives.gradient = 'from-purple-500 via-pink-500 to-cyan-500';
          changiExclusives.terminals = [
            { name: 'Jewel', count: 4, pulse: true },
            { name: 'T1', count: 2 },
            { name: 'T3', count: 1 }
          ];
          changiExclusives.previews = ['💎', '🦋', '🎢', '🎬'];
          changiExclusives.count = 7; // Override to show curated count
          changiExclusives.featured = true;
        }
        
        setCollections(transformedCollections);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, [airportCode, terminalNumber]);

  // Universal collections available everywhere
  const universalCollections = [
    { name: 'Coffee & Chill', emoji: '☕', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Quick Bites', emoji: '⚡', gradient: 'from-yellow-400 to-amber-500' },
    { name: 'Lounge Life', emoji: '💎', gradient: 'from-purple-500 to-indigo-600' },
    { name: 'Duty Free', emoji: '🛍️', gradient: 'from-pink-500 to-rose-600' }
  ];

  const handleCollectionClick = async (collection: Collection) => {
    // Fetch amenities for this collection
    try {
      const { data, error } = await supabase
        .from('collection_amenities')
        .select(`
          amenity_detail!inner(*)
        `)
        .eq('collection_id', collection.id)
        .eq('amenity_detail.airport_code', airportCode)
        .order('priority', { ascending: false })
        .limit(7);

      if (!error && data) {
        const attractions = data.map((item: any) => ({
          name: item.amenity_detail.name,
          terminal: item.amenity_detail.terminal_code,
          icon: '✨',
          time: `${Math.floor(Math.random() * 10) + 2} min walk`,
          description: item.amenity_detail.description
        }));
        
        setSelectedCollection({
          ...collection,
          attractions
        });
      } else {
        setSelectedCollection(collection);
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setSelectedCollection(collection);
    }
  };

  const getAirportName = () => {
    switch(airportCode) {
      case 'SIN': return 'Singapore Changi';
      case 'SYD': return 'Sydney Airport';
      case 'LHR': return 'London Heathrow';
      default: return airportCode;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  // Find featured collection (Changi Exclusives or first featured)
  const featuredCollection = collections.find(c => c.featured) || collections[0];
  const otherCollections = collections.filter(c => c.id !== featuredCollection?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Gradient animation styles */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .gradient-animate {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Best Of {terminalCode}
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`px-4 py-6 transform transition-all duration-700 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Discover {airportCode === 'SIN' ? 'Changi' : getAirportName()}
        </h2>
        <p className="text-gray-600">Curated collections for your journey</p>
      </div>

      {/* Featured Collection (Changi Exclusives) */}
      {featuredCollection && airportCode === 'SIN' && featuredCollection.collection_id === 'changi-exclusives' && (
        <div className={`px-4 mb-6 transform transition-all duration-700 delay-100 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div 
            onClick={() => handleCollectionClick(featuredCollection)}
            className="relative overflow-hidden rounded-3xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 4s ease infinite'
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="relative backdrop-blur-sm bg-white/10 p-8 border border-white/20">
              <div className="flex flex-col items-center text-center">
                {/* Centered Title Section */}
                <span className="text-4xl animate-bounce mb-3" style={{ animationDuration: '3s' }}>
                  {featuredCollection.emoji}
                </span>
                <h3 className="text-2xl font-bold text-white mb-2">{featuredCollection.name}</h3>
                <p className="text-white/90 text-sm max-w-[280px]">
                  {featuredCollection.description}
                </p>
              </div>
              
              {/* Terminal Pills - Centered */}
              {featuredCollection.terminals && (
                <div className="flex gap-2 mt-6 flex-wrap justify-center">
                  {featuredCollection.terminals.map((terminal, idx) => (
                    <div 
                      key={terminal.name}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5"
                      style={{ 
                        animation: animateIn ? `bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${idx * 100}ms forwards` : 'none'
                      }}
                    >
                      {terminal.pulse && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                      {!terminal.pulse && (
                        <div className="w-2 h-2 bg-white/70 rounded-full" />
                      )}
                      <span className="text-xs font-semibold text-white">{terminal.name}</span>
                      <span className="text-xs text-white/80">{terminal.count}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Preview Icons - Centered */}
              {featuredCollection.previews && (
                <div className="flex gap-2 mt-5 justify-center">
                  {featuredCollection.previews.map((emoji, idx) => (
                    <div 
                      key={idx}
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform transition-all hover:scale-110"
                      style={{ 
                        animation: animateIn ? `fade-in 0.5s ease-out ${idx * 50 + 300}ms forwards` : 'none',
                        opacity: animateIn ? 1 : 0
                      }}
                    >
                      <span className="text-2xl">{emoji}</span>
                    </div>
                  ))}
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <span className="text-sm text-white font-bold">+3</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Subtle animation overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Other Collections */}
      {otherCollections.length > 0 && (
        <div className={`px-4 transform transition-all duration-700 delay-200 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {airportCode === 'SIN' ? 'Singapore Specials' : 'More Collections'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {otherCollections.slice(0, 4).map((collection, idx) => (
              <div
                key={collection.id}
                onClick={() => handleCollectionClick(collection)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${idx * 100 + 300}ms` }}
              >
                <div className={`bg-gradient-to-br ${collection.gradient} rounded-xl p-4 mb-3 flex items-center justify-center`}>
                  <span className="text-3xl">{collection.emoji}</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{collection.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{collection.count || 0} spots</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal Collections - Horizontal Scroll */}
      <div className={`mt-8 mb-20 transform transition-all duration-700 delay-300 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-4">Always Available</h3>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {universalCollections.map((collection) => (
            <div
              key={collection.name}
              className={`flex-shrink-0 bg-gradient-to-br ${collection.gradient} rounded-2xl p-4 w-32 cursor-pointer transform transition-all hover:scale-105`}
            >
              <span className="text-2xl">{collection.emoji}</span>
              <h4 className="text-white font-semibold text-sm mt-2">{collection.name}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Collection Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedCollection.name}</h3>
                <button 
                  onClick={() => setSelectedCollection(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {selectedCollection.attractions && selectedCollection.attractions.length > 0 ? (
                <div className="space-y-3">
                  {selectedCollection.attractions.map((attraction: any, idx: number) => (
                    <div 
                      key={idx}
                      className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{attraction.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{attraction.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{attraction.terminal}</span>
                            <Clock className="w-3 h-3 text-gray-500 ml-2" />
                            <span className="text-xs text-gray-500">{attraction.time}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No amenities available for this collection yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalBestOfGenZ;
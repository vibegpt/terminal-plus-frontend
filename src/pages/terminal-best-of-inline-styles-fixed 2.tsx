import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, MapPin, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigateToAmenity } from '@/utils/amenityNavigation';

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

// Mock data for testing when Supabase doesn't return data
const mockCollections: Collection[] = [
  {
    id: '1',
    collection_id: 'changi-exclusives',
    name: 'Changi Exclusives',
    emoji: '✨',
    description: 'Attractions you won\'t find in any other airport',
    gradient: 'from-purple-500 via-pink-500 to-cyan-500',
    count: 7,
    featured: true,
    terminals: [
      { name: 'Jewel', count: 4, pulse: true },
      { name: 'T1', count: 2 },
      { name: 'T3', count: 1 }
    ],
    previews: ['💎', '🦋', '🎢', '🎬']
  },
  {
    id: '2',
    collection_id: 'garden-paradise',
    name: 'Garden Paradise',
    emoji: '🌺',
    description: 'World-renowned themed gardens',
    gradient: 'from-green-500 to-emerald-600',
    count: 5
  },
  {
    id: '3',
    collection_id: 'local-flavors',
    name: 'Local Flavors',
    emoji: '🥟',
    description: 'Authentic Singaporean cuisine',
    gradient: 'from-red-500 to-orange-600',
    count: 12
  },
  {
    id: '4',
    collection_id: 'entertainment',
    name: 'Entertainment Hub',
    emoji: '🎮',
    description: 'Gaming, movies & fun zones',
    gradient: 'from-purple-500 to-pink-600',
    count: 8
  },
  {
    id: '5',
    collection_id: 'rest-recharge',
    name: 'Rest & Recharge',
    emoji: '😴',
    description: 'Lounges, spas & quiet zones',
    gradient: 'from-indigo-500 to-purple-600',
    count: 6
  }
];

const TerminalBestOfGenZ: React.FC = () => {
  const { terminalCode } = useParams<{ terminalCode: string }>();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [airportCode, terminalNumber] = terminalCode?.split('-') || ['SIN', 'T3'];

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching collections for ${airportCode} ${terminalNumber}`);
        
        const { data, error } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airportCode,
          p_terminal: terminalNumber
        });
        
        if (error) {
          console.error('Supabase error:', error);
          setError('Failed to load collections from database');
          // Use mock data as fallback
          console.log('Using mock data as fallback');
          setCollections(mockCollections);
          setLoading(false);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('No data returned from Supabase, using mock data');
          setCollections(mockCollections);
          setLoading(false);
          return;
        }
        
        // Transform data for our needs
        const transformedCollections: Collection[] = data.map((col: any) => ({
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
          changiExclusives.count = 7;
          changiExclusives.featured = true;
        }
        
        setCollections(transformedCollections);
      } catch (err) {
        console.error('Failed to fetch:', err);
        setError('Failed to load collections');
        // Use mock data as fallback
        setCollections(mockCollections);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, [airportCode, terminalNumber]);

  const handleCollectionClick = async (collection: Collection) => {
    // Navigate to the collection detail page with Netflix-style view
    navigate(`/collection/${terminalCode}/${collection.collection_id}`, {
      state: {
        collection: {
          ...collection,
          terminal: terminalCode,
          airportCode: airportCode
        }
      }
    });
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

  const featuredCollection = collections.find(c => c.featured) || collections[0];
  const otherCollections = collections.filter(c => c.id !== featuredCollection?.id);

  // Inline styles for the animated gradient
  const gradientCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 4s ease infinite',
    borderRadius: '24px',
    overflow: 'hidden',
    cursor: 'pointer',
    transform: 'scale(1)',
    transition: 'transform 0.3s ease'
  };

  const glassOverlayStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '32px'
  };

  const floatingEmojiStyle: React.CSSProperties = {
    fontSize: '40px',
    animation: 'float 3s ease-in-out infinite',
    marginBottom: '12px'
  };

  const terminalPillStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '9999px',
    padding: '6px 12px'
  };

  const previewIconStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Add keyframe animations */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Best Of {terminalCode}
          </h1>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Error message if needed */}
      {error && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">Note: Using sample data. {error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className={`px-4 py-6 transform transition-all duration-700 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Discover {airportCode === 'SIN' ? 'Changi' : airportCode}
        </h2>
        <p className="text-gray-600">Curated collections for your journey</p>
      </div>

      {/* Featured Collection - Changi Exclusives with INLINE STYLES */}
      {featuredCollection && (
        <div className={`px-4 mb-6 transform transition-all duration-700 delay-100 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div 
            style={gradientCardStyle}
            onClick={() => handleCollectionClick(featuredCollection)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          >
            <div style={glassOverlayStyle}>
              <div className="flex flex-col items-center text-center">
                <span style={floatingEmojiStyle}>{featuredCollection.emoji}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{featuredCollection.name}</h3>
                <p className="text-white/90 text-sm max-w-[280px]">
                  {featuredCollection.description}
                </p>
                
                {/* Terminal Pills with inline styles */}
                {featuredCollection.terminals && (
                  <div className="flex gap-2 mt-6 flex-wrap justify-center">
                    {featuredCollection.terminals.map((terminal, idx) => (
                      <div 
                        key={terminal.name}
                        style={{
                          ...terminalPillStyle,
                          animation: animateIn ? `bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${idx * 100}ms forwards` : 'none'
                        }}
                      >
                        {terminal.pulse && (
                          <div className="w-2 h-2 bg-white rounded-full pulse-dot" />
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
                
                {/* Preview Icons with inline styles */}
                {featuredCollection.previews && (
                  <div className="flex gap-2 mt-5 justify-center">
                    {featuredCollection.previews.map((emoji, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          ...previewIconStyle,
                          opacity: animateIn ? 1 : 0,
                          animation: animateIn ? `fadeIn 0.5s ease-out ${idx * 50 + 300}ms forwards` : 'none'
                        }}
                      >
                        <span className="text-2xl">{emoji}</span>
                      </div>
                    ))}
                    <div style={previewIconStyle}>
                      <span className="text-sm text-white font-bold">+3</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Collections Grid */}
      {otherCollections.length > 0 && (
        <div className={`px-4 transform transition-all duration-700 delay-200 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {airportCode === 'SIN' ? 'Singapore Specials' : 'More Collections'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {otherCollections.slice(0, 4).map((collection) => (
              <div
                key={collection.id}
                onClick={() => handleCollectionClick(collection)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div 
                  className="rounded-xl p-4 mb-3 flex items-center justify-center"
                  style={{
                    background: collection.gradient.includes('green') ? 'linear-gradient(135deg, #10b981, #059669)' :
                               collection.gradient.includes('red') ? 'linear-gradient(135deg, #ef4444, #ea580c)' :
                               collection.gradient.includes('purple') ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' :
                               collection.gradient.includes('indigo') ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                               'linear-gradient(135deg, #6b7280, #9ca3af)'
                  }}
                >
                  <span className="text-3xl">{collection.emoji}</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{collection.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{collection.count || 0} spots</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal removed - now navigates to collection detail page */}
    </div>
  );
};

export default TerminalBestOfGenZ;
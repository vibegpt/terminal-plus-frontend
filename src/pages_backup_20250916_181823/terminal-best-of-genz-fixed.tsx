import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import '../styles/changi-exclusives.css';

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
  
  const [airportCode, terminalNumber] = terminalCode?.split('-') || ['SIN', 'T3'];

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_collections_for_terminal', {
          p_airport_code: airportCode,
          p_terminal: terminalNumber
        });
        
        if (error) {
          console.error('Error:', error);
          setLoading(false);
          return;
        }
        
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, [airportCode, terminalNumber]);

  const handleCollectionClick = async (collection: Collection) => {
    try {
      const { data, error } = await supabase
        .from('collection_amenities')
        .select(`amenity_detail!inner(*)`)
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
        
        setSelectedCollection({ ...collection, attractions });
      } else {
        setSelectedCollection(collection);
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setSelectedCollection(collection);
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

  const featuredCollection = collections.find(c => c.featured) || collections[0];
  const otherCollections = collections.filter(c => c.id !== featuredCollection?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

      {/* Hero Section */}
      <div className={`px-4 py-6 transform transition-all duration-700 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Discover {airportCode === 'SIN' ? 'Changi' : airportCode}
        </h2>
        <p className="text-gray-600">Curated collections for your journey</p>
      </div>

      {/* Featured Collection - Changi Exclusives with PROPER GRADIENT */}
      {featuredCollection && airportCode === 'SIN' && featuredCollection.collection_id === 'changi-exclusives' && (
        <div className={`px-4 mb-6 transform transition-all duration-700 delay-100 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div 
            onClick={() => handleCollectionClick(featuredCollection)}
            className="changi-exclusives-card gradient-animate"
          >
            <div className="glass-overlay p-8">
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl float-animation mb-3">{featuredCollection.emoji}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{featuredCollection.name}</h3>
                <p className="text-white/90 text-sm max-w-[280px]">
                  {featuredCollection.description}
                </p>
                
                {/* Terminal Pills */}
                {featuredCollection.terminals && (
                  <div className="flex gap-2 mt-6 flex-wrap justify-center">
                    {featuredCollection.terminals.map((terminal, idx) => (
                      <div 
                        key={terminal.name}
                        className={`terminal-pill ${animateIn ? 'bounce-in' : ''} bounce-in-delay-${idx}`}
                      >
                        {terminal.pulse && <div className="w-2 h-2 bg-white rounded-full pulse-dot" />}
                        {!terminal.pulse && <div className="w-2 h-2 bg-white/70 rounded-full" />}
                        <span className="text-xs font-semibold text-white">{terminal.name}</span>
                        <span className="text-xs text-white/80">{terminal.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preview Icons */}
                {featuredCollection.previews && (
                  <div className="flex gap-2 mt-5 justify-center">
                    {featuredCollection.previews.map((emoji, idx) => (
                      <div key={idx} className={`preview-icon ${animateIn ? 'fade-in' : ''}`} style={{ animationDelay: `${idx * 50 + 300}ms` }}>
                        <span className="text-2xl">{emoji}</span>
                      </div>
                    ))}
                    <div className="preview-icon">
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
            {otherCollections.slice(0, 4).map((collection, idx) => (
              <div
                key={collection.id}
                onClick={() => handleCollectionClick(collection)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div 
                  className={`bg-gradient-to-br ${collection.gradient} rounded-xl p-4 mb-3 flex items-center justify-center`}
                  style={{
                    background: collection.gradient.includes('purple') 
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                      : undefined
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

      {/* Selected Collection Modal */}
      {selectedCollection && (
        <div className="modal-overlay" onClick={() => setSelectedCollection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedCollection.name}</h3>
                <button onClick={() => setSelectedCollection(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {selectedCollection.attractions && selectedCollection.attractions.length > 0 ? (
                <div className="space-y-3">
                  {selectedCollection.attractions.map((attraction: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-100 transition-all">
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
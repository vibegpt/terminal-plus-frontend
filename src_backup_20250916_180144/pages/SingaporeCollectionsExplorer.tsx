import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmart7WithCollections } from '../hooks/useSmart7WithCollections';
import { CollectionGrid } from '../components/CollectionGrid';
import { Smart7Badge } from '../components/Smart7Badge';
import { RefreshButton } from '../components/RefreshButton';

const FEATURED_COLLECTIONS = [
  { slug: 'singapore-exclusives', terminal: 'T3' },
  { slug: 'quick-bites', terminal: 'T3' },
  { slug: 'lounges-affordable', terminal: 'T3' },
  { slug: 'gardens-at-dawn', terminal: 'T2' },
  { slug: 'coffee-worth-walk', terminal: 'T1' }
];

export const SingaporeCollectionsExplorer: React.FC = () => {
  const [activeCollection, setActiveCollection] = useState(FEATURED_COLLECTIONS[0]);
  const [allCollections, setAllCollections] = useState<any[]>([]);
  
  const { 
    collection, 
    smart7Items, 
    loading, 
    refreshSelection,
    trackClick 
  } = useSmart7WithCollections({
    collectionSlug: activeCollection.slug,
    terminal: activeCollection.terminal
  });

  // Load all available collections on mount
  useEffect(() => {
    loadAllCollections();
  }, []);

  const loadAllCollections = async () => {
    // Mock data for now - replace with actual Supabase call
    const mockCollections = [
      { collection_id: 'singapore-exclusives', name: 'Singapore Exclusives', icon: '🇸🇬', total_amenities: 15, featured: true },
      { collection_id: 'quick-bites', name: 'Quick Bites', icon: '🏃', total_amenities: 23, featured: true },
      { collection_id: 'lounges-affordable', name: 'Affordable Lounges', icon: '🛋️', total_amenities: 8, featured: true },
      { collection_id: 'gardens-at-dawn', name: 'Gardens at Dawn', icon: '🌅', total_amenities: 12, featured: false },
      { collection_id: 'coffee-worth-walk', name: 'Coffee Worth Walking', icon: '☕', total_amenities: 18, featured: false }
    ];
    setAllCollections(mockCollections);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={`bg-gradient-to-br ${collection?.gradient || 'from-blue-500 to-purple-600'}`}>
          <div className="px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white"
            >
              <h1 className="text-3xl font-bold mb-2">
                Changi Smart7 Collections
              </h1>
              <p className="text-white/90">
                AI-curated experiences for every mood
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="relative -mt-1">
          <svg viewBox="0 0 1440 120" className="w-full h-12">
            <path 
              fill={collection?.gradient ? '#fff' : '#f3f4f6'}
              d="M0,32L48,37.3C96,43,192,53,288,56C384,59,480,53,576,45.3C672,37,768,27,864,26.7C960,27,1056,37,1152,42.7C1248,48,1344,48,1392,48L1440,48L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </div>

      {/* Collection Selector */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Browse Collections
            </h2>
            <Smart7Badge />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {allCollections.slice(0, 10).map((col) => (
              <motion.button
                key={col.collection_id}
                onClick={() => setActiveCollection({
                  slug: col.collection_id,
                  terminal: activeCollection.terminal
                })}
                className={`p-3 rounded-xl transition-all ${
                  activeCollection.slug === col.collection_id
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-1">{col.icon}</div>
                <div className="text-xs font-medium truncate">{col.name}</div>
                <div className={`text-xs mt-1 ${
                  activeCollection.slug === col.collection_id ? 'text-white/80' : 'text-gray-500'
                }`}>
                  {col.total_amenities} spots
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Collection Display */}
      {collection && (
        <motion.div
          key={collection.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 mt-6"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Collection Header */}
            <div className={`bg-gradient-to-br ${collection.gradient || 'from-blue-500 to-purple-600'} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{collection.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{collection.name}</h2>
                    <p className="text-white/90 mt-1">{collection.description}</p>
                  </div>
                </div>
                <RefreshButton onClick={refreshSelection} loading={loading} />
              </div>
              
              {/* Stats */}
              <div className="flex gap-3 mt-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">
                  Terminal {activeCollection.terminal}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">
                  {smart7Items.length} curated
                </span>
                {collection.featured && (
                  <span className="px-3 py-1 bg-yellow-400/30 backdrop-blur rounded-full text-sm flex items-center gap-1">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>

            {/* Smart7 Grid */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                <CollectionGrid
                  amenities={smart7Items}
                  onAmenityClick={(amenity) => {
                    trackClick(amenity.id);
                    // Navigate to amenity detail
                    window.location.href = `/amenity/${amenity.amenity_slug}`;
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Terminal Selector (Fixed Bottom) */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Terminal:</span>
          {['T1', 'T2', 'T3', 'T4'].map(t => (
            <button
              key={t}
              onClick={() => setActiveCollection({
                ...activeCollection,
                terminal: t
              })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCollection.terminal === t
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// REMOVE THIS LINE if it exists:
// import { useAllVibesWithCollections } from '../hooks/useSupabaseCollections';

export function VibesFeed() {
  const navigate = useNavigate();

  // Hardcoded vibes data (no external hook needed)
  const vibes = {
    discover: {
      name: 'Discover',
      icon: '🧭',
      description: 'Unique experiences and hidden gems',
      collections: [
        { id: 'hidden-gems', slug: 'hidden-gems', name: 'Hidden Gems', icon: '💎', spots: 17, description: 'Secret spots most travelers miss' },
        { id: 'jewel-discovery', slug: 'jewel-discovery', name: 'Jewel Discovery', icon: '🏰', spots: 9, description: 'Iconic Jewel Changi attractions' },
        { id: 'nature-escapes', slug: 'nature-escapes', name: 'Nature Escapes', icon: '🦋', spots: 10, description: 'Green spaces and gardens' }
      ]
    },
    work: {
      name: 'Work',
      icon: '💼',
      description: 'Stay productive on the go',
      collections: [
        { id: 'workstations', slug: 'workstations', name: 'Workstations', icon: '💻', spots: 12, description: 'Quiet spaces with power and WiFi' },
        { id: 'meeting-rooms', slug: 'meeting-rooms', name: 'Meeting Rooms', icon: '📊', spots: 8, description: 'Professional meeting spaces' },
        { id: 'business-centers', slug: 'business-centers', name: 'Business Centers', icon: '🏢', spots: 3, description: 'Full business services' }
      ]
    },
    comfort: {
      name: 'Comfort',
      icon: '😴',
      description: 'Rest and relaxation',
      collections: [
        { id: 'lounges', slug: 'lounges', name: 'Lounges', icon: '👑', spots: 10, description: 'Premium lounge experiences' },
        { id: 'sleep-pods', slug: 'sleep-pods', name: 'Sleep Pods', icon: '😴', spots: 8, description: 'Quick rest solutions' },
        { id: 'spa-wellness', slug: 'spa-wellness', name: 'Spa & Wellness', icon: '💆', spots: 6, description: 'Rejuvenation services' }
      ]
    },
    refuel: {
      name: 'Refuel',
      icon: '🍜',
      description: 'Food and dining options',
      collections: [
        { id: 'local-flavors', slug: 'local-flavors', name: 'Local Flavors', icon: '🥘', spots: 15, description: 'Authentic Singapore cuisine' },
        { id: 'quick-bites', slug: 'quick-bites', name: 'Quick Bites', icon: '🍔', spots: 12, description: 'Fast food and snacks' },
        { id: 'fine-dining', slug: 'fine-dining', name: 'Fine Dining', icon: '🍷', spots: 8, description: 'Premium dining experiences' }
      ]
    },
    shop: {
      name: 'Shop',
      icon: '🛍️',
      description: 'Retail therapy and souvenirs',
      collections: [
        { id: 'duty-free', slug: 'duty-free', name: 'Duty Free', icon: '🛒', spots: 20, description: 'Tax-free shopping' },
        { id: 'luxury-brands', slug: 'luxury-brands', name: 'Luxury Brands', icon: '💎', spots: 15, description: 'Premium brand stores' },
        { id: 'local-souvenirs', slug: 'local-souvenirs', name: 'Local Souvenirs', icon: '🎁', spots: 10, description: 'Singapore mementos' }
      ]
    },
    chill: {
      name: 'Chill',
      icon: '😌',
      description: 'Easy-going vibes and relaxation',
      collections: [
        { id: 'coffee-culture', slug: 'coffee-culture', name: 'Coffee Culture', icon: '☕', spots: 8, description: 'Best coffee spots' },
        { id: 'quiet-corners', slug: 'quiet-corners', name: 'Quiet Corners', icon: '🤫', spots: 6, description: 'Peaceful spaces' },
        { id: 'garden-vibes', slug: 'garden-vibes', name: 'Garden Vibes', icon: '🌿', spots: 12, description: 'Natural relaxation areas' }
      ]
    }
  };

  const handleCollectionClick = (vibeKey: string, collectionSlug: string) => {
    console.log(`Navigating to: /collection/${collectionSlug}`);
    navigate(`/collection/${collectionSlug}`);
  };

  const handleVibeClick = (vibeKey: string) => {
    navigate(`/vibe/${vibeKey}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="p-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2">Terminal+</h1>
          <p className="text-slate-400 text-lg">Phase 3 • SIN-T3</p>
          <p className="text-slate-500 text-sm mt-1">Discover collections organized by your vibe</p>
        </motion.div>
      </header>

      {/* Vibes Grid */}
      <div className="px-6 pb-20">
        {Object.entries(vibes).map(([vibeKey, vibeData], index) => (
          <motion.section
            key={vibeKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="mb-12"
          >
            {/* Vibe Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{vibeData.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{vibeData.name}</h2>
                  <p className="text-slate-400">{vibeData.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleVibeClick(vibeKey)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                See all →
              </button>
            </div>

            {/* Collections Horizontal Scroll */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4" style={{ width: 'max-content' }}>
                {vibeData.collections.map((collection) => (
                  <motion.div
                    key={collection.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 cursor-pointer hover:bg-slate-700/50 transition-all"
                    style={{ minWidth: '250px' }}
                    onClick={() => handleCollectionClick(vibeKey, collection.slug)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{collection.icon}</span>
                      <span className="text-sm text-slate-400">{collection.spots} spots</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{collection.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

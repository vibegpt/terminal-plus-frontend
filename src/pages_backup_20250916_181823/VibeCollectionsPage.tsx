// src/pages/VibeCollectionsPage.tsx
// All Collections for a Specific Vibe

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function VibeCollectionsPage() {
  const { vibeSlug } = useParams();
  const navigate = useNavigate();

  // Mock collections data - replace with your actual data
  const vibeCollections = {
    discover: [
      { id: 'hidden-gems', slug: 'hidden-gems', name: 'Hidden Gems', icon: '💎', spots: 17, description: 'Secret spots most travelers miss' },
      { id: 'jewel-discovery', slug: 'jewel-discovery', name: 'Jewel Discovery', icon: '🏰', spots: 9, description: 'Iconic Jewel Changi attractions' },
      { id: 'nature-escapes', slug: 'nature-escapes', name: 'Nature Escapes', icon: '🦋', spots: 10, description: 'Green spaces and gardens' },
      { id: 'instagram-hotspots', slug: 'instagram-hotspots', name: 'Instagram Hotspots', icon: '📸', spots: 12, description: 'Picture-perfect moments' },
      { id: 'local-art', slug: 'local-art', name: 'Local Art', icon: '🎨', spots: 8, description: 'Singapore\'s creative scene' }
    ],
    work: [
      { id: 'workstations', slug: 'workstations', name: 'Workstations', icon: '💻', spots: 12, description: 'Quiet spaces with power and WiFi' },
      { id: 'meeting-rooms', slug: 'meeting-rooms', name: 'Meeting Rooms', icon: '📊', spots: 8, description: 'Professional meeting spaces' },
      { id: 'business-centers', slug: 'business-centers', name: 'Business Centers', icon: '🏢', spots: 3, description: 'Full business services' },
      { id: 'quiet-zones', slug: 'quiet-zones', name: 'Quiet Zones', icon: '🤫', spots: 6, description: 'Silent work areas' }
    ],
    comfort: [
      { id: 'lounges', slug: 'lounges', name: 'Lounges', icon: '👑', spots: 10, description: 'Premium lounge experiences' },
      { id: 'sleep-pods', slug: 'sleep-pods', name: 'Sleep Pods', icon: '😴', spots: 8, description: 'Quick rest solutions' },
      { id: 'spa-wellness', slug: 'spa-wellness', name: 'Spa & Wellness', icon: '💆', spots: 6, description: 'Rejuvenation services' },
      { id: 'shower-facilities', slug: 'shower-facilities', name: 'Shower Facilities', icon: '🚿', spots: 4, description: 'Refresh and recharge' }
    ],
    refuel: [
      { id: 'local-flavors', slug: 'local-flavors', name: 'Local Flavors', icon: '🥘', spots: 15, description: 'Authentic Singapore cuisine' },
      { id: 'quick-bites', slug: 'quick-bites', name: 'Quick Bites', icon: '🍔', spots: 12, description: 'Fast food and snacks' },
      { id: 'fine-dining', slug: 'fine-dining', name: 'Fine Dining', icon: '🍷', spots: 8, description: 'Premium dining experiences' },
      { id: 'coffee-culture', slug: 'coffee-culture', name: 'Coffee Culture', icon: '☕', spots: 10, description: 'Best coffee spots' }
    ],
    shop: [
      { id: 'duty-free', slug: 'duty-free', name: 'Duty Free', icon: '🛒', spots: 20, description: 'Tax-free shopping' },
      { id: 'luxury-brands', slug: 'luxury-brands', name: 'Luxury Brands', icon: '💎', spots: 15, description: 'Premium brand stores' },
      { id: 'local-souvenirs', slug: 'local-souvenirs', name: 'Local Souvenirs', icon: '🎁', spots: 10, description: 'Singapore mementos' },
      { id: 'tech-gadgets', slug: 'tech-gadgets', name: 'Tech Gadgets', icon: '📱', spots: 12, description: 'Latest technology' }
    ],
    chill: [
      { id: 'coffee-culture', slug: 'coffee-culture', name: 'Coffee Culture', icon: '☕', spots: 8, description: 'Best coffee spots' },
      { id: 'quiet-corners', slug: 'quiet-corners', name: 'Quiet Corners', icon: '🤫', spots: 6, description: 'Peaceful spaces' },
      { id: 'garden-vibes', slug: 'garden-vibes', name: 'Garden Vibes', icon: '🌿', spots: 12, description: 'Natural relaxation areas' },
      { id: 'reading-nooks', slug: 'reading-nooks', name: 'Reading Nooks', icon: '📚', spots: 5, description: 'Book lovers paradise' }
    ]
  };

  const getVibeIcon = (vibeSlug: string) => {
    const icons: Record<string, string> = {
      discover: '🧭',
      work: '💼',
      comfort: '😴',
      refuel: '🍜',
      shop: '🛍️',
      chill: '😌'
    };
    return icons[vibeSlug || ''] || '✨';
  };

  const getVibeName = (vibeSlug: string) => {
    const names: Record<string, string> = {
      discover: 'Discover',
      work: 'Work',
      comfort: 'Comfort',
      refuel: 'Refuel',
      shop: 'Shop',
      chill: 'Chill'
    };
    return names[vibeSlug || ''] || 'Vibe';
  };

  const getVibeDescription = (vibeSlug: string) => {
    const descriptions: Record<string, string> = {
      discover: 'Unique experiences and hidden gems to explore',
      work: 'Stay productive with dedicated workspaces',
      comfort: 'Rest and relaxation for weary travelers',
      refuel: 'Delicious food and refreshing drinks',
      shop: 'Retail therapy and souvenir shopping',
      chill: 'Easy-going vibes and peaceful spaces'
    };
    return descriptions[vibeSlug || ''] || 'Amazing collections for your vibe';
  };

  const collections = vibeCollections[vibeSlug as keyof typeof vibeCollections] || [];

  const handleCollectionClick = (collectionSlug: string) => {
    navigate(`/collection/${vibeSlug}/${collectionSlug}`);
  };

  const handleBack = () => {
    navigate('/vibes-feed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-sm p-4 border-b border-slate-700/50">
        <motion.button 
          onClick={handleBack}
          className="mb-3 text-blue-400 hover:text-blue-300 flex items-center gap-2"
          whileHover={{ x: -4 }}
        >
          ← Back to Vibes
        </motion.button>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{getVibeIcon(vibeSlug || '')}</span>
          <div>
            <h1 className="text-3xl font-bold">{getVibeName(vibeSlug || '')}</h1>
            <p className="text-slate-400">{getVibeDescription(vibeSlug || '')}</p>
          </div>
        </div>
      </header>

      {/* Collections Grid */}
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">All {getVibeName(vibeSlug || '')} Collections</h2>
          <p className="text-slate-400">{collections.length} collections available</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCollectionClick(collection.slug)}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 cursor-pointer hover:bg-slate-700/50 transition-all border border-slate-700/50 hover:border-slate-600/50"
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl">{collection.icon}</span>
              </div>
              <h3 className="text-white font-semibold text-center mb-2 text-lg">
                {collection.name}
              </h3>
              <p className="text-slate-400 text-sm text-center mb-3 line-clamp-2">
                {collection.description}
              </p>
              <div className="flex items-center justify-center">
                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                  {collection.spots} spots
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {collections.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No collections found</h3>
            <p className="text-slate-400">This vibe doesn't have any collections yet.</p>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/vibes-feed')}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-20 text-white font-bold"
      >
        🏠
      </motion.button>
    </div>
  );
}

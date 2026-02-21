import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../main';

const VIBE_CONFIG = {
  comfort: {
    icon: '🛏️',
    name: 'Comfort',
    description: 'Rest and recharge areas',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50'
  },
  quick: {
    icon: '⚡',
    name: 'Quick',
    description: 'Fast options for tight connections',
    gradient: 'from-yellow-500 to-orange-600',
    bgGradient: 'from-yellow-50 via-amber-50 to-orange-50'
  },
  chill: {
    icon: '😌',
    name: 'Chill',
    description: 'Peaceful spots to unwind',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 via-indigo-50 to-purple-50'
  },
  refuel: {
    icon: '🍔',
    name: 'Refuel',
    description: 'Food & drinks for every craving',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 via-red-50 to-pink-50'
  },
  work: {
    icon: '💼',
    name: 'Work',
    description: 'Productive spaces with WiFi',
    gradient: 'from-slate-600 to-gray-800',
    bgGradient: 'from-slate-50 via-gray-50 to-zinc-50'
  },
  shop: {
    icon: '🛍️',
    name: 'Shop',
    description: 'Retail therapy awaits',
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 via-rose-50 to-red-50'
  },
  discover: {
    icon: '🔍',
    name: 'Discover',
    description: 'Unique experiences only at Changi',
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50'
  }
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [vibeSections, setVibeSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerminal, setSelectedTerminal] = useState('T3');

  useEffect(() => {
    loadCollectionsByVibe();
  }, [selectedTerminal]);

  const loadCollectionsByVibe = async () => {
    setLoading(true);
    
    const vibeOrder = getVibeOrder();
    const sections = [];
    
    for (const vibe of vibeOrder) {
      const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .contains('vibe_tags', [vibe])
        .limit(5);
      
      sections.push({
        vibe,
        collections: collections || []
      });
    }
    
    setVibeSections(sections);
    setLoading(false);
  };

  const getVibeOrder = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) {
      return ['comfort', 'refuel', 'quick', 'chill', 'work', 'discover', 'shop'];
    } else if (hour >= 11 && hour < 17) {
      return ['refuel', 'quick', 'shop', 'discover', 'chill', 'comfort', 'work'];
    } else {
      return ['comfort', 'chill', 'refuel', 'shop', 'discover', 'quick', 'work'];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Luxury Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Changi Airport
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-gray-600">AI-Curated Collections</span>
              </div>
            </div>
            
            {/* Terminal Selector with Glass Effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-20" />
              <div className="relative flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/50 shadow-sm">
                <MapPin className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  className="text-sm font-medium bg-transparent outline-none"
                >
                  <option value="T1">Terminal 1</option>
                  <option value="T2">Terminal 2</option>
                  <option value="T3">Terminal 3</option>
                  <option value="T4">Terminal 4</option>
                  <option value="Jewel">Jewel</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Vibes Feed with Adaptive Luxe Design */}
      <div className="pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          vibeSections.map((section, sectionIndex) => {
            const vibeInfo = VIBE_CONFIG[section.vibe as keyof typeof VIBE_CONFIG];
            
            return (
              <motion.section
                key={section.vibe}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className={`relative py-8 bg-gradient-to-r ${vibeInfo.bgGradient}`}
              >
                {/* Decorative gradient orb */}
                <div className={`absolute top-0 right-10 w-32 h-32 bg-gradient-to-br ${vibeInfo.gradient} rounded-full blur-3xl opacity-20`} />
                
                {/* Vibe Header */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="text-4xl filter drop-shadow-lg"
                      >
                        {vibeInfo.icon}
                      </motion.div>
                      <div>
                        <h2 className={`text-2xl font-bold bg-gradient-to-r ${vibeInfo.gradient} bg-clip-text text-transparent`}>
                          {vibeInfo.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {vibeInfo.description}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/vibe/${section.vibe}`)}
                      className="group flex items-center gap-1 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm hover:shadow-md transition-all"
                    >
                      <span className="text-sm font-semibold text-gray-700">See all</span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  </div>
                </div>

                {/* Collections Carousel with Glass Cards */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
                    {section.collections.length > 0 ? (
                      section.collections.map((collection: any, index: number) => (
                        <motion.button
                          key={collection.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/collection/${collection.collection_id}`)}
                          className="relative w-44 h-36 group"
                        >
                          {/* Glass card background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg group-hover:shadow-xl transition-all" />
                          
                          {/* Gradient accent */}
                          <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${vibeInfo.gradient} opacity-10 rounded-b-2xl`} />
                          
                          {/* Content */}
                          <div className="relative h-full flex flex-col items-center justify-center p-4">
                            <div className="text-3xl mb-2">{collection.icon}</div>
                            <h3 className="font-semibold text-sm text-gray-800 text-center line-clamp-2">
                              {collection.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-gray-500">
                                {collection.total_amenities || 7} spots
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-amber-600 font-medium">
                                Smart7
                              </span>
                            </div>
                          </div>
                          
                          {/* Hover gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${vibeInfo.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                        </motion.button>
                      ))
                    ) : (
                      // Skeleton loaders with glass effect
                      [1, 2, 3].map(i => (
                        <div key={i} className="w-44 h-36">
                          <div className="w-full h-full bg-white/40 backdrop-blur-sm rounded-2xl animate-pulse border border-white/30" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HomePage;

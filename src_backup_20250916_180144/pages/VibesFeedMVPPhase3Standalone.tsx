import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Coffee, Briefcase, ShoppingBag, Zap, Compass, 
  Crown, MapPin, Wifi, Clock, Plane, AlertCircle, Sparkles,
  TrendingUp, Heart, Gauge, Timer, Calendar, Navigation
} from 'lucide-react';

// Import Adaptive Luxe styles
import '../styles/adaptive-luxe.css';

// Types
type BoardingStatus = 'rush' | 'imminent' | 'soon' | 'normal' | 'extended';

// Inline vibe definitions
const VIBES = [
  { slug: 'quick', name: 'Quick', emoji: '⚡', subtitle: 'Grab & go essentials', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { slug: 'refuel', name: 'Refuel', emoji: '🍔', subtitle: 'Food & drinks', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { slug: 'chill', name: 'Chill', emoji: '🧘', subtitle: 'Quiet spaces', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { slug: 'comfort', name: 'Comfort', emoji: '😌', subtitle: 'Rest & recharge', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { slug: 'work', name: 'Work', emoji: '💼', subtitle: 'Get productive', gradient: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)' },
  { slug: 'shop', name: 'Shop', emoji: '🛍️', subtitle: 'Retail therapy', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  { slug: 'discover', name: 'Discover', emoji: '🗺️', subtitle: 'Explore terminal', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
];

// Mock collections
const getCollectionsForVibe = (vibeKey: string) => {
  const collections = {
    quick: [
      { collection_slug: 'grab-go', collection_name: 'Grab & Go', spots_total: 12, spots_near_you: 3 },
      { collection_slug: 'essentials', collection_name: 'Travel Essentials', spots_total: 8, spots_near_you: 2 },
      { collection_slug: 'last-minute', collection_name: 'Last Minute', spots_total: 15, spots_near_you: 5 }
    ],
    refuel: [
      { collection_slug: 'coffee', collection_name: 'Coffee & Tea', spots_total: 18, spots_near_you: 4 },
      { collection_slug: 'quick-bites', collection_name: 'Quick Bites', spots_total: 22, spots_near_you: 6 },
      { collection_slug: 'restaurants', collection_name: 'Restaurants', spots_total: 14, spots_near_you: 3 }
    ],
    chill: [
      { collection_slug: 'quiet-zones', collection_name: 'Quiet Zones', spots_total: 8, spots_near_you: 2 },
      { collection_slug: 'meditation', collection_name: 'Meditation Spaces', spots_total: 4, spots_near_you: 1 },
      { collection_slug: 'reading', collection_name: 'Reading Areas', spots_total: 6, spots_near_you: 2 }
    ],
    comfort: [
      { collection_slug: 'lounges', collection_name: 'Lounges', spots_total: 10, spots_near_you: 2 },
      { collection_slug: 'sleep-pods', collection_name: 'Sleep Pods', spots_total: 6, spots_near_you: 1 },
      { collection_slug: 'spa', collection_name: 'Spa & Wellness', spots_total: 8, spots_near_you: 2 }
    ],
    work: [
      { collection_slug: 'workstations', collection_name: 'Workstations', spots_total: 12, spots_near_you: 4 },
      { collection_slug: 'meeting-rooms', collection_name: 'Meeting Rooms', spots_total: 5, spots_near_you: 2 },
      { collection_slug: 'business-centers', collection_name: 'Business Centers', spots_total: 3, spots_near_you: 1 }
    ],
    shop: [
      { collection_slug: 'duty-free', collection_name: 'Duty Free', spots_total: 25, spots_near_you: 8 },
      { collection_slug: 'luxury', collection_name: 'Luxury Brands', spots_total: 18, spots_near_you: 5 },
      { collection_slug: 'souvenirs', collection_name: 'Souvenirs', spots_total: 12, spots_near_you: 3 }
    ],
    discover: [
      { collection_slug: 'art-exhibits', collection_name: 'Art Exhibits', spots_total: 6, spots_near_you: 2 },
      { collection_slug: 'cultural', collection_name: 'Cultural Spots', spots_total: 8, spots_near_you: 3 },
      { collection_slug: 'viewing-decks', collection_name: 'Viewing Decks', spots_total: 4, spots_near_you: 1 }
    ]
  };
  return collections[vibeKey] || [];
};

// Inline utility functions
const getBoardingStatus = (boardingTime: number): BoardingStatus => {
  const now = Date.now();
  const timeToBoarding = (boardingTime - now) / 60000; // in minutes
  
  if (timeToBoarding <= 15 && timeToBoarding > 0) return 'rush';
  if (timeToBoarding <= 45 && timeToBoarding > 15) return 'imminent';
  if (timeToBoarding <= 90 && timeToBoarding > 45) return 'soon';
  if (timeToBoarding <= 180 && timeToBoarding > 90) return 'normal';
  return 'extended';
};

const getOptimalVibeOrder = (boardingTime: number) => {
  const status = getBoardingStatus(boardingTime);
  
  const orders: Record<BoardingStatus, string[]> = {
    rush: ['quick', 'refuel', 'chill', 'comfort', 'work', 'shop', 'discover'],
    imminent: ['refuel', 'quick', 'chill', 'shop', 'comfort', 'work', 'discover'],
    soon: ['comfort', 'refuel', 'chill', 'shop', 'work', 'quick', 'discover'],
    normal: ['work', 'comfort', 'discover', 'refuel', 'chill', 'shop', 'quick'],
    extended: ['discover', 'comfort', 'refuel', 'work', 'shop', 'chill', 'quick']
  };
  
  return orders[status];
};

const shouldHighlightVibe = (vibeKey: string, boardingStatus: BoardingStatus): boolean => {
  const highlightMap: Record<BoardingStatus, string[]> = {
    'rush': ['quick'],
    'imminent': ['refuel', 'quick'],
    'soon': ['comfort', 'refuel'],
    'normal': ['work', 'comfort'],
    'extended': ['discover', 'comfort']
  };
  
  return highlightMap[boardingStatus]?.includes(vibeKey) || false;
};

// Enhanced CSS
const enhancedStyles = `
  /* Dark theme background */
  .dark-gradient-bg {
    background: linear-gradient(180deg, #0A0E27 0%, #1a1a2e 100%);
    min-height: 100vh;
  }
  
  /* Glass effects */
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
  }
  
  .glass-vibe-section {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }
  
  .glass-collection-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    transition: all 0.3s ease;
  }
  
  .glass-collection-card:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  /* Animations */
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .vibe-section-enter {
    animation: slideIn 0.5s ease-out forwards;
  }
  
  /* Live dot */
  .live-dot {
    width: 8px;
    height: 8px;
    background: #00FF88;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 255, 136, 0);
    }
  }
  
  /* Scrollbar hide */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Badge Component
const VibeBadge: React.FC<{
  vibeKey: string;
  boardingStatus: BoardingStatus;
  isTopRanked: boolean;
}> = ({ vibeKey, boardingStatus, isTopRanked }) => {
  const getBadgeConfig = () => {
    if (boardingStatus === 'rush' && vibeKey === 'quick') {
      return {
        text: '⚡ Grab & Go',
        gradient: 'linear-gradient(135deg, #FF006E 0%, #FF4B2B 100%)',
        pulse: true
      };
    }
    
    if (boardingStatus === 'extended' && vibeKey === 'discover') {
      return {
        text: '✨ Explore',
        gradient: 'linear-gradient(135deg, #00FF88 0%, #00B4D8 100%)',
        glow: true
      };
    }
    
    if (isTopRanked) {
      return {
        text: '🔥 Trending',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
    }
    
    return null;
  };
  
  const config = getBadgeConfig();
  if (!config) return null;
  
  return (
    <div 
      className={`inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold
        ${config.pulse ? 'animate-pulse' : ''}`}
      style={{ background: config.gradient }}
    >
      {config.text}
    </div>
  );
};

// Main Component
const VibesFeedMVPPhase3Standalone: React.FC = () => {
  const navigate = useNavigate();
  const [vibeSections, setVibeSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardingTime, setBoardingTime] = useState(Date.now() + (120 * 60 * 1000)); // 120 minutes from now
  const [terminal] = useState('SIN-T3');
  
  const boardingStatus = getBoardingStatus(boardingTime);
  const vibeOrder = useMemo(() => getOptimalVibeOrder(boardingTime), [boardingTime]);
  
  // Load vibe data
  useEffect(() => {
    const loadVibeData = async () => {
      setLoading(true);
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create vibe sections based on order
      const sections = vibeOrder.map((vibeKey, index) => {
        const vibeData = VIBES.find(v => v.slug === vibeKey);
        if (!vibeData) return null;
        
        return {
          vibe: vibeKey,
          name: vibeData.name,
          icon: vibeData.emoji,
          description: vibeData.subtitle,
          gradient: vibeData.gradient,
          collections: getCollectionsForVibe(vibeKey).slice(0, 4),
          order: index,
          highlighted: shouldHighlightVibe(vibeKey, boardingStatus)
        };
      }).filter(Boolean);
      
      setVibeSections(sections);
      setLoading(false);
    };
    
    loadVibeData();
  }, [vibeOrder, boardingStatus]);
  
  // Time controls for testing
  const adjustTime = (minutes: number) => {
    setBoardingTime(Date.now() + (minutes * 60 * 1000));
  };
  
  if (loading) {
    return (
      <div className="dark-gradient-bg p-4 text-white flex items-center justify-center min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: enhancedStyles }} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your vibe feed...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dark-gradient-bg min-h-screen pb-20">
      <style dangerouslySetInnerHTML={{ __html: enhancedStyles }} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Terminal+ <span className="text-sm text-white/60">Phase 3</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-white/70 text-sm">{terminal}</span>
          </div>
        </div>
      </header>
      
      {/* Time Controls for Testing */}
      <div className="glass-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">Test Controls</h3>
          <span className="text-white/60 text-sm">
            Status: <span className="text-white font-bold">{boardingStatus.toUpperCase()}</span>
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => adjustTime(10)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">
            Rush (10m)
          </button>
          <button onClick={() => adjustTime(30)} className="px-3 py-1 bg-orange-500 text-white rounded text-sm">
            Imminent (30m)
          </button>
          <button onClick={() => adjustTime(60)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            Soon (60m)
          </button>
          <button onClick={() => adjustTime(120)} className="px-3 py-1 bg-green-500 text-white rounded text-sm">
            Normal (2h)
          </button>
          <button onClick={() => adjustTime(240)} className="px-3 py-1 bg-purple-500 text-white rounded text-sm">
            Extended (4h)
          </button>
        </div>
        <div className="mt-2">
          <p className="text-white/60 text-xs">
            Time to boarding: {Math.floor((boardingTime - Date.now()) / 60000)} minutes
          </p>
        </div>
      </div>
      
      {/* Status Banner */}
      <div className="glass-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">
              {boardingStatus === 'rush' ? '⚡ Rush to Gate!' :
               boardingStatus === 'imminent' ? '⏰ Boarding Soon' :
               boardingStatus === 'soon' ? '☕ Relax & Recharge' :
               boardingStatus === 'normal' ? '💼 Be Productive' :
               '✨ Extended Layover'}
            </h3>
            <p className="text-white/70 text-sm">
              {Math.floor((boardingTime - Date.now()) / 60000)} minutes to boarding
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
            <p className="text-white/60 text-xs">Gate</p>
            <p className="text-white font-bold">A23</p>
          </div>
        </div>
      </div>
      
      {/* Vibe Sections */}
      <div className="mt-6 space-y-6">
        {vibeSections.map((section, index) => (
          <div
            key={section.vibe}
            className="glass-vibe-section mx-4 p-4 vibe-section-enter"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Vibe Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Rank indicator */}
                {index < 3 && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{
                      background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                 index === 1 ? 'linear-gradient(135deg, #C0C0C0, #808080)' :
                                 'linear-gradient(135deg, #CD7F32, #8B4513)'
                    }}
                  >
                    {index + 1}
                  </div>
                )}
                
                <span className="text-3xl">{section.icon}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{section.name}</h2>
                    {section.highlighted && (
                      <VibeBadge
                        vibeKey={section.vibe}
                        boardingStatus={boardingStatus}
                        isTopRanked={index === 0}
                      />
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{section.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate(`/collections/${section.vibe}`)}
                className="glass-card px-3 py-1.5 rounded-full text-white text-sm font-medium
                         hover:bg-white/20 transition-all duration-300"
              >
                See all
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
            
            {/* Collections Horizontal Scroll */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3">
                {section.collections.map((collection: any) => (
                  <div
                    key={collection.collection_slug}
                    className="glass-collection-card min-w-[140px] p-3 cursor-pointer"
                    onClick={() => navigate(`/collection/${collection.collection_slug}`)}
                  >
                    <div 
                      className="h-20 rounded-lg mb-2 flex items-center justify-center text-2xl"
                      style={{ background: section.gradient }}
                    >
                      {section.icon}
                    </div>
                    <h3 className="text-white font-semibold text-sm line-clamp-1">
                      {collection.collection_name}
                    </h3>
                    <p className="text-white/50 text-xs mt-0.5">
                      {collection.spots_total} spots
                    </p>
                    {collection.spots_near_you > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs">
                          {collection.spots_near_you} nearby
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VibesFeedMVPPhase3Standalone;
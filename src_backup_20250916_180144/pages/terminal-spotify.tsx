import React, { useState, useEffect } from 'react';
import { 
  Play,
  Star,
  Clock,
  MapPin,
  Eye,
  Camera,
  Heart,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Bookmark,
  CheckCircle,
  ArrowLeft,
  Volume2,
  Shuffle,
  SkipForward,
  MoreHorizontal,
  Share,
  Plus,
  Hash,
  User
} from 'lucide-react';

// Enhanced Terminal Data with more collections and better structure
const TERMINAL_COLLECTIONS = {
  'SIN-T3': {
    terminal: 'Singapore Changi T3',
    tagline: 'Where airports become destinations',
    hero_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    stats: {
      totalExperiences: 24,
      avgRating: 4.7,
      totalPlays: 1200,
      duration: '2-4 hours'
    },
    collections: [
      {
        id: 'must-see',
        title: 'Must-See Changi',
        subtitle: 'The iconic experiences that make Changi legendary',
        emoji: '✨',
        color: 'from-purple-500 to-pink-500',
        plays: 450,
        items: [
          {
            id: 'butterfly-garden',
            name: 'Butterfly Garden',
            artist: 'Changi Attractions',
            category: 'Attraction',
            description: 'Southeast Asia\'s first butterfly garden in an airport with 1,000+ butterflies',
            image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
            walkTime: '8 min walk',
            duration: '30-45 min',
            highlights: ['1,000+ live butterflies', 'Tropical paradise', 'Free entry'],
            vibe_tags: ['Explore', 'Chill'],
            rating: 4.8,
            wow_factor: 95,
            plays: 89,
            isPlaying: false,
            ugc_data: {
              photos: [
                {
                  id: 'ugc_1',
                  url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
                  user: { username: 'sarah_travels', avatar: '👩🏽‍💼' },
                  timestamp: '2h ago',
                  likes: 47,
                  vibe_tags: ['explore', 'magical'],
                  caption: 'Actually couldn\'t believe this was in an airport! 🦋'
                }
              ],
              recent_visitors: ['@alex_wanders', '@travel_emma', '@digital_nomad_jay'],
              total_tagged: 156,
              trending_hashtags: ['#ChangiButterflies', '#AirportGoals', '#LayoverWin']
            }
          },
          {
            id: 'indoor-waterfall',
            name: 'Rain Vortex (T1 Jewel)',
            artist: 'Jewel Changi',
            category: 'Attraction',
            description: 'World\'s tallest indoor waterfall at 40 meters high',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
            walkTime: '12 min walk',
            duration: '20-30 min',
            highlights: ['World\'s tallest indoor waterfall', 'Instagram famous', 'Stunning light shows'],
            vibe_tags: ['Explore', 'Shop'],
            rating: 4.9,
            wow_factor: 98,
            plays: 156,
            isPlaying: false,
            ugc_data: {
              photos: [
                {
                  id: 'ugc_2',
                  url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
                  user: { username: 'travel_tiktok', avatar: '🎬' },
                  timestamp: '45min ago',
                  likes: 203,
                  vibe_tags: ['explore', 'wow'],
                  caption: 'This is actually INSANE for an airport 💦'
                }
              ],
              recent_visitors: ['@wanderlust_wilson', '@photo_phil', '@asia_adventures'],
              total_tagged: 342,
              trending_hashtags: ['#RainVortex', '#JewelChangi', '#TravelTok']
            }
          },
          {
            id: 'movie-theatre',
            name: 'Free Movie Theatre',
            artist: 'Changi Entertainment',
            category: 'Entertainment',
            description: 'Catch the latest movies for free while waiting for your flight',
            image: 'https://images.unsplash.com/photo-1489599505483-b2aa5ba89d91?w=400',
            walkTime: '5 min walk',
            duration: '90-120 min',
            highlights: ['Latest movies', 'Completely free', 'Comfortable seating'],
            vibe_tags: ['Chill', 'Comfort'],
            rating: 4.6,
            wow_factor: 85,
            plays: 67,
            isPlaying: false
          }
        ]
      },
      {
        id: 'comfort-vibes',
        title: 'Comfort Vibes',
        subtitle: 'Recharge and relax during your layover',
        emoji: '🛋️',
        color: 'from-blue-500 to-cyan-500',
        plays: 320,
        items: [
          {
            id: 'krisflyer-lounge',
            name: 'KrisFlyer Gold Lounge',
            artist: 'Singapore Airlines',
            category: 'Lounge',
            description: 'Premium lounge with shower facilities and gourmet dining',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
            walkTime: '3 min walk',
            duration: 'Flexible',
            highlights: ['Shower facilities', 'Premium dining', 'City views'],
            vibe_tags: ['Comfort', 'Refuel'],
            rating: 4.7,
            wow_factor: 88,
            plays: 145,
            isPlaying: false
          },
          {
            id: 'sleep-pods',
            name: 'Ambassador Transit Hotel',
            artist: 'Plaza Premium Group',
            category: 'Rest',
            description: 'Comfortable pods for quick naps and relaxation',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
            walkTime: '4 min walk',
            duration: '1-6 hours',
            highlights: ['Private pods', 'Hourly rates', 'Shower included'],
            vibe_tags: ['Comfort', 'Chill'],
            rating: 4.5,
            wow_factor: 80,
            plays: 98,
            isPlaying: false
          }
        ]
      },
      {
        id: 'foodie-essentials',
        title: 'Foodie Essentials',
        subtitle: 'Taste Singapore\'s best flavors without leaving the airport',
        emoji: '🍜',
        color: 'from-orange-500 to-red-500',
        plays: 280,
        items: [
          {
            id: 'singapore-food-street',
            name: 'Singapore Food Street',
            artist: 'Changi Food Court',
            category: 'Food Court',
            description: 'Authentic hawker food recreating Singapore\'s food heritage',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
            walkTime: '6 min walk',
            duration: '30-45 min',
            highlights: ['Authentic hawker food', 'Local heritage', '24/7 operation'],
            vibe_tags: ['Refuel', 'Explore'],
            rating: 4.4,
            wow_factor: 82,
            plays: 134,
            isPlaying: false
          },
          {
            id: 'toast-box',
            name: 'Toast Box',
            artist: 'Local Favorites',
            category: 'Cafe',
            description: 'Traditional kaya toast and local coffee experience',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
            walkTime: '2 min walk',
            duration: '15-20 min',
            highlights: ['Traditional kaya toast', 'Local coffee culture', 'Quick service'],
            vibe_tags: ['Refuel', 'Quick'],
            rating: 4.3,
            wow_factor: 75,
            plays: 87,
            isPlaying: false
          }
        ]
      }
    ]
  }
};

const TerminalSpotifyInterface = ({ terminalCode }: { terminalCode: string }) => {
  const [activeView, setActiveView] = useState<'overview' | 'collection'>('overview');
  const [activeCollection, setActiveCollection] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showUGCModal, setShowUGCModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<any>(null);

  const terminalData = TERMINAL_COLLECTIONS[terminalCode as keyof typeof TERMINAL_COLLECTIONS];
  
  if (!terminalData) return null;

  const handlePlayCollection = (collection: any) => {
    setActiveCollection(collection);
    setActiveView('collection');
    setIsPlaying(true);
  };

  const handleSaveItem = (itemId: string) => {
    setSavedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handlePlayItem = (itemId: string) => {
    setCurrentlyPlaying(currentlyPlaying === itemId ? null : itemId);
  };

  const formatDuration = (duration: string) => {
    // Convert duration like "30-45 min" to "3:45" format
    const match = duration.match(/(\d+)-?(\d+)?\s*min/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = Math.floor((min % 60) * 0.6); // Rough conversion
      return `${Math.floor(min/10)}:${sec.toString().padStart(2, '0')}`;
    }
    return '3:45';
  };

  const openUGCModal = (experience: any) => {
    setSelectedExperience(experience);
    setShowUGCModal(true);
  };

  // UGC Modal Component
  const UGCModal = () => {
    if (!selectedExperience?.ugc_data) return null;

    return (
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showUGCModal ? 'block' : 'hidden'}`}>
        <div className="bg-slate-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Community Posts</h3>
            <button 
              onClick={() => setShowUGCModal(false)}
              className="p-2 hover:bg-slate-700 rounded-full transition-all"
            >
              ×
            </button>
          </div>

          {/* UGC Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Featured Photo */}
            <div className="relative">
              <img 
                src={selectedExperience.ugc_data.photos[0]?.url}
                alt={selectedExperience.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4 rounded-b-lg">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-xs">
                    {selectedExperience.ugc_data.photos[0]?.user.avatar}
                  </div>
                  <span className="text-sm font-medium">@{selectedExperience.ugc_data.photos[0]?.user.username}</span>
                  <span className="text-xs opacity-75">{selectedExperience.ugc_data.photos[0]?.timestamp}</span>
                </div>
                <p className="text-sm mt-2 opacity-90">
                  {selectedExperience.ugc_data.photos[0]?.caption}
                </p>
              </div>
            </div>

            {/* Social Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{selectedExperience.ugc_data.total_tagged}</div>
                <div className="text-xs text-gray-400">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{selectedExperience.ugc_data.photos[0]?.likes}</div>
                <div className="text-xs text-gray-400">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{selectedExperience.ugc_data.recent_visitors.length}</div>
                <div className="text-xs text-gray-400">Recent Visitors</div>
              </div>
            </div>

            {/* Recent Visitors */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Recent Visitors</h4>
              <div className="flex flex-wrap gap-2">
                {selectedExperience.ugc_data.recent_visitors.map((visitor: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-slate-700 text-white text-xs rounded-full"
                  >
                    {visitor}
                  </span>
                ))}
              </div>
            </div>

            {/* Trending Hashtags */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Trending Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedExperience.ugc_data.trending_hashtags.map((hashtag: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full flex items-center gap-1"
                  >
                    <Hash className="w-3 h-3" />
                    {hashtag.replace('#', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Add Your Photo CTA */}
            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all">
              <Camera className="w-4 h-4" />
              Share Your Experience
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Overview/Home View
  const OverviewView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Spotify-style Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${terminalData.hero_image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        
        <div className="relative px-6 pt-16 pb-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Terminal Hero */}
          <div className="flex items-end gap-6 mb-8">
            <div className="w-56 h-56 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl flex items-center justify-center relative">
              <div className="text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-4" />
                <div className="font-bold text-xl mb-1">BEST OF</div>
                <div className="text-lg opacity-90">{terminalCode}</div>
              </div>
              
              {/* Large Play Button */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all shadow-xl"
              >
                <Play className="h-8 w-8 ml-1" fill="currentColor" />
              </button>
            </div>

            {/* Terminal Info */}
            <div className="flex-1">
              <div className="text-sm uppercase tracking-wider opacity-70 mb-2">
                Terminal Collection
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {terminalData.terminal}
              </h1>
              <p className="text-xl opacity-90 mb-6">
                {terminalData.tagline}
              </p>
              
              <div className="flex items-center flex-wrap gap-4 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Terminal+</span>
                </div>
                <span>•</span>
                <span>{terminalData.stats.totalPlays.toLocaleString()} plays</span>
                <span>•</span>
                <span>{terminalData.stats.totalExperiences} experiences</span>
                <span>•</span>
                <span>{terminalData.stats.duration}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-8 py-3 bg-green-500 text-black font-semibold rounded-full hover:scale-105 hover:bg-green-400 transition-all flex items-center gap-2"
            >
              <Play className="h-5 w-5" fill="currentColor" />
              Play
            </button>
            <button className="p-3 border border-gray-500 rounded-full hover:bg-white/10 transition-all">
              <Heart className="h-6 w-6" />
            </button>
            <button className="p-3 border border-gray-500 rounded-full hover:bg-white/10 transition-all">
              <Share className="h-6 w-6" />
            </button>
            <button className="p-3 border border-gray-500 rounded-full hover:bg-white/10 transition-all">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="px-6 pb-24">
        <h2 className="text-2xl font-bold mb-6">Popular Collections</h2>
        
        <div className="grid gap-6">
          {terminalData.collections.map((collection, index) => (
            <div 
              key={collection.id}
              onClick={() => handlePlayCollection(collection)}
              className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                {/* Collection Cover */}
                <div className="relative">
                  <div className={`w-20 h-20 bg-gradient-to-r ${collection.color} rounded-lg flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl transition-all`}>
                    {collection.emoji}
                  </div>
                  {/* UGC Activity Indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* Collection Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{collection.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{collection.subtitle}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{collection.plays.toLocaleString()} plays</span>
                    <span>•</span>
                    <span>{collection.items.length} experiences</span>
                    <span>•</span>
                    <span className="text-purple-400">Live UGC</span>
                  </div>
                </div>

                {/* Play Button */}
                <button 
                  className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayCollection(collection);
                  }}
                >
                  <Play className="h-5 w-5 ml-1" fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UGC Modal */}
      <UGCModal />
    </div>
  );

  // Collection Detail View
  const CollectionView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Collection Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="relative px-6 pt-16 pb-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setActiveView('overview')}
              className="p-2 rounded-full bg-black/20 backdrop-blur-sm"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Collection Hero */}
          <div className="flex items-end gap-6 mb-8">
            <div className={`w-48 h-48 bg-gradient-to-r ${activeCollection.color} rounded-2xl shadow-2xl flex items-center justify-center text-4xl`}>
              {activeCollection.emoji}
            </div>

            <div className="flex-1">
              <div className="text-sm uppercase tracking-wider opacity-70 mb-2">
                Collection
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {activeCollection.title}
              </h1>
              <p className="text-lg opacity-90 mb-4">
                {activeCollection.subtitle}
              </p>
              
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span>Terminal+ • {activeCollection.plays.toLocaleString()} plays • {activeCollection.items.length} experiences</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="px-8 py-3 bg-green-500 text-black font-semibold rounded-full hover:scale-105 transition-all flex items-center gap-2">
              <Play className="h-5 w-5" fill="currentColor" />
              Play
            </button>
            <button className="p-3 border border-gray-500 rounded-full hover:bg-white/10 transition-all">
              <Shuffle className="h-6 w-6" />
            </button>
            <button className="p-3 border border-gray-500 rounded-full hover:bg-white/10 transition-all">
              <Heart className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Track Listing */}
      <div className="px-6 pb-24">
        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-4">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Title</div>
          <div className="col-span-2">Plays</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-1"></div>
        </div>

        {/* Experience Items */}
        <div className="space-y-2">
          {activeCollection.items.map((item: any, index: number) => {
            const isSaved = savedItems.includes(item.id);
            const isCurrentlyPlaying = currentlyPlaying === item.id;
            
            return (
              <div 
                key={item.id}
                className={`group grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-white/5 transition-all ${isCurrentlyPlaying ? 'bg-white/10' : ''}`}
              >
                {/* Track Number / Play Button */}
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => handlePlayItem(item.id)}
                    className="w-8 h-8 flex items-center justify-center group-hover:bg-white/20 rounded transition-all"
                  >
                    {isCurrentlyPlaying ? (
                      <Volume2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-gray-400 group-hover:hidden">{index + 1}</span>
                    )}
                    {!isCurrentlyPlaying && (
                      <Play className="h-4 w-4 hidden group-hover:block" fill="currentColor" />
                    )}
                  </button>
                </div>

                {/* Experience Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    {/* UGC Indicator */}
                    {item.ugc_data && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-[10px]">
                        {item.ugc_data.photos[0]?.user.avatar}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={`font-medium ${isCurrentlyPlaying ? 'text-green-500' : 'text-white'}`}>
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <span>{item.artist}</span>
                      {item.ugc_data && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-purple-400">
                            {item.ugc_data.total_tagged} posts
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plays */}
                <div className="col-span-2 text-sm text-gray-400">
                  {item.plays?.toLocaleString() || '—'}
                </div>

                {/* Duration */}
                <div className="col-span-2 text-sm text-gray-400">
                  {formatDuration(item.duration)}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {/* UGC Button */}
                    {item.ugc_data && (
                      <button
                        onClick={() => openUGCModal(item)}
                        className="p-1 rounded transition-all text-gray-400 hover:text-purple-400"
                        title="View community posts"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                    )}
                    {/* Save Button */}
                    <button
                      onClick={() => handleSaveItem(item.id)}
                      className={`p-1 rounded transition-all ${
                        isSaved 
                          ? 'text-green-500' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {isSaved ? <CheckCircle className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return activeView === 'overview' ? <OverviewView /> : <CollectionView />;
};

// UGC Contribution Interface Component
const UGCContributionPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Main FAB */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all hover:scale-105"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-slate-800 rounded-xl p-4 min-w-48 shadow-xl">
          <div className="text-white text-sm font-medium mb-3">Share Your Experience</div>
          <div className="space-y-2">
            <button className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
            <button className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Upload from Gallery
            </button>
            <button className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Add to Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TerminalSpotifyShowcase() {
  return (
    <div className="max-w-md mx-auto bg-black relative">
      <TerminalSpotifyInterface terminalCode="SIN-T3" />
      <UGCContributionPanel />
    </div>
  );
}

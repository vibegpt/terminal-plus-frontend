import React, { useState } from 'react';
import { SwipeableVibeCard } from '../components/SwipeableVibeCard';
import { MobileCollections } from '../components/MobileCollections';
import { MobileButton } from '../components/MobileButton';
import { MobileNavigation, CompactMobileNavigation, FloatingActionButton } from '../components/MobileNavigation';
import { PullToRefresh, MinimalPullToRefresh } from '../components/PullToRefresh';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { RefreshCw, Plus, Heart, Trash2, Search, MapPin } from 'lucide-react';

const mockAmenities = [
  {
    id: '1',
    name: 'Starbucks Coffee',
    description: 'Premium coffee and light snacks available 24/7',
    logo_url: '',
    price_level: '$$',
    primary_vibe: 'Refuel'
  },
  {
    id: '2',
    name: 'Singapore Airlines Lounge',
    description: 'Premium lounge with complimentary food and beverages',
    logo_url: '',
    price_level: '$$$',
    primary_vibe: 'Chill'
  },
  {
    id: '3',
    name: 'Duty Free Shopping',
    description: 'Tax-free shopping for luxury goods and souvenirs',
    logo_url: '',
    price_level: '$$$$',
    primary_vibe: 'Shop'
  },
  {
    id: '4',
    name: 'Free WiFi Zone',
    description: 'High-speed internet access throughout the terminal',
    logo_url: '',
    price_level: 'Free',
    primary_vibe: 'Work'
  }
];

const mockCollections = [
  {
    id: '1',
    name: 'Quick Bites',
    description: 'Fast food and quick service restaurants',
    image_url: '',
    amenity_count: 12,
    vibe: 'Quick'
  },
  {
    id: '2',
    name: 'Luxury Shopping',
    description: 'High-end brands and duty-free shopping',
    image_url: '',
    amenity_count: 8,
    vibe: 'Shop'
  },
  {
    id: '3',
    name: 'Relaxation Spots',
    description: 'Quiet areas and lounges for relaxation',
    image_url: '',
    amenity_count: 5,
    vibe: 'Chill'
  },
  {
    id: '4',
    name: 'Work Spaces',
    description: 'Business centers and charging stations',
    image_url: '',
    amenity_count: 15,
    vibe: 'Work'
  }
];

export const MobileDemo: React.FC = () => {
  const [amenities, setAmenities] = useState(mockAmenities);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleBookmark = (amenity: any) => {
    setBookmarked(prev => 
      prev.includes(amenity.id) 
        ? prev.filter(id => id !== amenity.id)
        : [...prev, amenity.id]
    );
  };

  const handleDelete = (amenity: any) => {
    setAmenities(prev => prev.filter(a => a.id !== amenity.id));
  };

  const handleCollectionClick = (collection: any) => {
    alert(`Clicked on ${collection.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40 safe-top">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Mobile Features Demo</h1>
          <p className="text-sm text-gray-600">Swipe, pull, and tap to explore</p>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-6">
          {/* Swipeable Cards Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Swipeable Amenity Cards
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Swipe right to bookmark, left to remove
            </p>
            <div className="space-y-3">
              {amenities.slice(0, 2).map((amenity) => (
                <SwipeableVibeCard
                  key={amenity.id}
                  amenity={amenity}
                  onBookmark={handleBookmark}
                  onDelete={handleDelete}
                  onTap={(amenity) => alert(`Tapped: ${amenity.name}`)}
                />
              ))}
            </div>
          </section>

          {/* Mobile Collections Section */}
          <section>
            <MobileCollections
              collections={mockCollections}
              onCollectionClick={handleCollectionClick}
              title="Featured Collections"
              showPagination={true}
              autoplay={false}
            />
          </section>

          {/* Mobile Buttons Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mobile-First Buttons
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <MobileButton
                variant="mobile"
                size="mobile"
                leftIcon={<Heart className="w-4 h-4" />}
                onClick={() => alert('Mobile button clicked!')}
              >
                Save
              </MobileButton>
              
              <MobileButton
                variant="outline"
                size="touch"
                onClick={() => alert('Touch button clicked!')}
              >
                Touch Me
              </MobileButton>
              
              <MobileButton
                variant="swipe"
                size="swipe"
                onClick={() => alert('Swipe action!')}
              >
                Swipe Action
              </MobileButton>
              
              <MobileButton
                variant="ghost"
                size="icon"
                onClick={() => alert('Icon button!')}
              >
                <Search className="w-5 h-5" />
              </MobileButton>
            </div>
          </section>

          {/* Pull to Refresh Demo */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pull to Refresh
            </h2>
            <MinimalPullToRefresh onRefresh={handleRefresh}>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm text-gray-600">
                  Pull down from the top to refresh this content
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </MinimalPullToRefresh>
          </section>

          {/* Bookmarked Items */}
          {bookmarked.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Bookmarked Items ({bookmarked.length})
              </h2>
              <div className="space-y-2">
                {bookmarked.map(id => {
                  const amenity = amenities.find(a => a.id === id);
                  return amenity ? (
                    <div key={id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {amenity.name}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </section>
          )}

          {/* Mobile Navigation Demo */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Navigation Styles
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Standard Navigation</h3>
                <CompactMobileNavigation />
              </div>
            </div>
          </section>

          {/* Floating Action Buttons */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Floating Actions
            </h2>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-4">
                Floating action buttons appear at the bottom of the screen
              </p>
              <div className="flex gap-2">
                <MobileButton
                  variant="outline"
                  size="sm"
                  onClick={() => alert('FAB clicked!')}
                >
                  Test FAB
                </MobileButton>
              </div>
            </div>
          </section>
        </div>
      </PullToRefresh>

      {/* Floating Action Buttons */}
      <FloatingActionButton
        onClick={() => alert('Add new amenity!')}
        icon={<Plus className="w-6 h-6" />}
        label="Add Amenity"
        position="bottom-right"
      />

      <FloatingActionButton
        onClick={() => alert('Search amenities!')}
        icon={<Search className="w-5 h-5" />}
        label="Search"
        position="bottom-left"
      />

      {/* Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default MobileDemo;

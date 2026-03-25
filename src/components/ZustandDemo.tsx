import React, { useState } from 'react';
import { useSelectedTerminal, useAppStore } from '../stores';
import { useVibeAmenities, useBookmarkAmenity, useSearchAmenities } from '../hooks/queries';
import { useBehaviorTracking } from '../context/BehaviorTrackingContext';

const ZustandDemo: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('refuel');
  
  // Zustand store selectors
  const currentTerminal = useSelectedTerminal();
  const appStore = useAppStore();
  const user = appStore.user;
  const theme = appStore.theme;
  
  // React Query hooks
  const { data: amenities, isLoading, error } = useVibeAmenities(selectedVibe);
  const { data: searchResults } = useSearchAmenities(searchQuery);
  const bookmarkMutation = useBookmarkAmenity();
  
  // Behavioral tracking
  const tracking = useBehaviorTracking();
  
  const handleTerminalChange = (terminalCode: string) => {
    appStore.setSelectedTerminal(terminalCode);
    tracking.trackEvent('terminal_change', { terminal: terminalCode });
  };
  
  const handleJourneyStart = () => {
    // Simplified - just set boarding time
    if (currentTerminal) {
      appStore.setBoardingTime(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
      tracking.trackEvent('journey_start', { terminal: currentTerminal });
    }
  };

  const handleThemeToggle = () => {
    appStore.setTheme(theme === 'light' ? 'dark' : 'light');
    tracking.trackEvent('theme_change', { theme: theme === 'light' ? 'dark' : 'light' });
  };

  const handleBookmark = (amenityId: number, amenityName: string) => {
    // Find the amenity from the store
    const amenity = appStore.amenities.find(a => a.id === amenityId);
    if (amenity) {
      appStore.addBookmark(amenity);
      tracking.trackEvent('amenity_bookmark', { amenityId, amenityName });
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      tracking.trackSearch(query, searchResults?.length || 0);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Zustand Store Demo</h1>
      
      {/* Terminal Selection */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Terminal Selection</h2>
        <div className="flex gap-2 mb-3">
          {['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'].map(terminal => (
            <button
              key={terminal}
              onClick={() => handleTerminalChange(terminal)}
              className={`px-3 py-1 rounded ${
                currentTerminal === terminal
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {terminal}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Current Terminal: {currentTerminal}
        </p>
      </div>
      
      {/* Journey Management */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Journey Management</h2>
        {appStore.boardingTime ? (
          <div className="bg-green-50 p-3 rounded">
            <p><strong>Boarding Time:</strong> {new Date(appStore.boardingTime).toLocaleTimeString()}</p>
            <p><strong>Terminal:</strong> {currentTerminal}</p>
          </div>
        ) : (
          <button
            onClick={handleJourneyStart}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Journey
          </button>
        )}
      </div>
      
      {/* Theme Preferences */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Theme Preferences</h2>
        <div className="flex items-center gap-4">
          <span>Current Theme: {theme}</span>
          <button
            onClick={handleThemeToggle}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
      
      {/* Current Vibe */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Current Vibe</h2>
        <div className="flex flex-wrap gap-2">
          {['refuel', 'quick', 'work', 'chill', 'comfort', 'shop', 'discover'].map(vibe => (
            <button
              key={vibe}
              onClick={() => setSelectedVibe(vibe)}
              className={`px-3 py-1 rounded capitalize ${
                selectedVibe === vibe
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Current Vibe: {selectedVibe}
        </p>
      </div>
      
      {/* Search */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Search Amenities</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search amenities..."
          className="w-full p-2 border rounded"
        />
        {searchResults && searchResults.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">
              Found {searchResults.length} results
            </p>
            <div className="space-y-2">
              {searchResults.slice(0, 3).map((amenity: any) => (
                <div key={amenity.id} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">{amenity.name}</p>
                  <p className="text-sm text-gray-600">{amenity.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Amenities List */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Amenities for "{selectedVibe}"</h2>
        {isLoading && <p>Loading amenities...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {amenities && (
          <div className="space-y-2">
            {amenities.slice(0, 5).map((amenity: any) => (
              <div key={amenity.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{amenity.name}</p>
                  <p className="text-sm text-gray-600">{amenity.description}</p>
                </div>
                <button
                  onClick={() => handleBookmark(amenity.id, amenity.name)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Bookmark
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Store State Display */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Current Store State</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({
            currentTerminal,
            boardingTime: appStore.boardingTime,
            theme,
            selectedVibe,
            bookmarksCount: appStore.bookmarks.length,
            amenitiesCount: appStore.amenities.length,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ZustandDemo;

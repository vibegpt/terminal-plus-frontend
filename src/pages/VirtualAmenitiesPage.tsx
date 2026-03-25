import React, { useState } from 'react';
import { VirtualAmenityList } from '../components/VirtualAmenityList';
import { usePaginatedAmenities } from '../hooks/usePaginatedAmenities';
import { VibeService } from '../services/VibeService';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';

const VIRTUAL_SCROLLING_OPTIONS = [
  { label: 'Small (300px)', value: 300 },
  { label: 'Medium (600px)', value: 600 },
  { label: 'Large (800px)', value: 800 }
];

const PAGINATION_OPTIONS = [
  { label: '10 items', value: 10 },
  { label: '20 items', value: 20 },
  { label: '50 items', value: 50 }
];

const VIBE_OPTIONS = [
  { label: 'Comfort', value: 'comfort' },
  { label: 'Chill', value: 'chill' },
  { label: 'Refuel', value: 'refuel' },
  { label: 'Work', value: 'work' },
  { label: 'Shop', value: 'shop' },
  { label: 'Quick', value: 'quick' },
  { label: 'Discover', value: 'discover' }
];

export const VirtualAmenitiesPage: React.FC = () => {
  const [selectedVibe, setSelectedVibe] = useState('comfort');
  const [virtualHeight, setVirtualHeight] = useState(600);
  const [pageSize, setPageSize] = useState(20);
  const [showVirtualScrolling, setShowVirtualScrolling] = useState(true);

  const {
    amenities,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh
  } = usePaginatedAmenities({
    vibe: selectedVibe,
    terminalCode: 'T3',
    airportCode: 'SIN',
    pageSize,
    enabled: true
  });

  const handleAmenityClick = (amenity: any) => {
    console.log('Amenity clicked:', amenity);
    // Navigate to amenity detail page
  };

  const handleLoadMore = async () => {
    await loadMore();
  };

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Virtual Scrolling & Pagination Demo
          </h1>
          <p className="text-gray-600">
            Performance-optimized amenity lists with virtual scrolling and pagination
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vibe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vibe
              </label>
              <select
                value={selectedVibe}
                onChange={(e) => setSelectedVibe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VIBE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGINATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Virtual Scrolling Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Virtual Height
              </label>
              <select
                value={virtualHeight}
                onChange={(e) => setVirtualHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VIRTUAL_SCROLLING_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Virtual Scrolling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowVirtualScrolling(true)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    showVirtualScrolling
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Virtual
                </button>
                <button
                  onClick={() => setShowVirtualScrolling(false)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    !showVirtualScrolling
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Normal
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {!showVirtualScrolling && hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Load More</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-500">Total Amenities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{amenities.length}</div>
              <div className="text-sm text-gray-500">Loaded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {showVirtualScrolling ? 'Virtual' : 'Normal'}
              </div>
              <div className="text-sm text-gray-500">Display Mode</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{pageSize}</div>
              <div className="text-sm text-gray-500">Page Size</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p className="font-medium">Error loading amenities</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {loading && amenities.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading amenities...</span>
            </div>
          )}

          {!loading && amenities.length === 0 && !error && (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No amenities found for the selected vibe</p>
            </div>
          )}

          {amenities.length > 0 && (
            <div className="p-4">
              {showVirtualScrolling ? (
                <VirtualAmenityList
                  amenities={amenities}
                  height={virtualHeight}
                  onAmenityClick={handleAmenityClick}
                />
              ) : (
                <div className="space-y-2">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      onClick={() => handleAmenityClick(amenity)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                          {amenity.logo_url ? (
                            <img
                              src={amenity.logo_url}
                              alt={amenity.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-gray-400 text-2xl">🏢</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {amenity.name}
                          </h3>
                          {amenity.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {amenity.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {amenity.primary_vibe}
                            </span>
                            {amenity.price_level && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {amenity.price_level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!showVirtualScrolling && hasMore && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualAmenitiesPage;

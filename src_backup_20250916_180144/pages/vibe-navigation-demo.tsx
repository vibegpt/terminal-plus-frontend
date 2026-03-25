import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VibeCard, VibeCardCompact } from '../components/ui/VibeCard';
import { CollectionCard, CollectionCardCompact } from '../components/ui/CollectionCard';
import { VIBES, getCollectionsForVibe, COLLECTION_MAPPINGS } from '../constants/vibeDefinitions';
import { cn } from '../lib/utils';

export default function VibeNavigationDemo() {
  const navigate = useNavigate();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'vibes' | 'collections' | 'amenities'>('vibes');

  const handleVibeClick = (vibeSlug: string) => {
    setSelectedVibe(vibeSlug);
    setViewMode('collections');
    setSelectedCollection(null);
  };

  const handleCollectionClick = (collectionSlug: string) => {
    setSelectedCollection(collectionSlug);
    setViewMode('amenities');
  };

  const handleBackToVibes = () => {
    setViewMode('vibes');
    setSelectedVibe(null);
    setSelectedCollection(null);
  };

  const handleBackToCollections = () => {
    setViewMode('collections');
    setSelectedCollection(null);
  };

  const getCurrentVibe = () => VIBES.find(v => v.slug === selectedVibe);
  const getCurrentCollections = () => selectedVibe ? getCollectionsForVibe(selectedVibe) : [];
  const getCurrentCollection = () => {
    if (!selectedVibe || !selectedCollection) return null;
    return COLLECTION_MAPPINGS[selectedVibe as keyof typeof COLLECTION_MAPPINGS]?.[selectedCollection];
  };

  const renderVibesView = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Vibe 🎯
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Select a vibe to discover curated collections of amazing experiences at Changi Airport
        </p>
      </div>

      {/* Vibe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {VIBES.map((vibe) => (
          <VibeCard
            key={vibe.slug}
            vibe={vibe}
            onClick={() => handleVibeClick(vibe.slug)}
            size="medium"
            className="relative"
          />
        ))}
      </div>

      {/* Navigation Flow Explanation */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Navigation Flow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">1️⃣</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Choose Vibe</h3>
            <p className="text-sm text-gray-600">
              Select from 6 curated vibes based on your interests
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">2️⃣</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Browse Collections</h3>
            <p className="text-sm text-gray-600">
              Explore 5-6 themed collections within each vibe
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">3️⃣</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Discover Amenities</h3>
            <p className="text-sm text-gray-600">
              Find specific spots and experiences in each collection
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollectionsView = () => {
    const currentVibe = getCurrentVibe();
    const collections = getCurrentCollections();

    if (!currentVibe) return null;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={handleBackToVibes}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Vibes
          </button>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-4xl">{currentVibe.emoji}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentVibe.name}</h1>
              <p className="text-xl text-gray-600">{currentVibe.subtitle}</p>
            </div>
          </div>
          
          {currentVibe.description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {currentVibe.description}
            </p>
          )}
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.slug}
              collection={collection}
              onClick={() => handleCollectionClick(collection.slug)}
              size="medium"
              showCount={true}
            />
          ))}
        </div>

        {/* Collection Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Collection Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {collections.length}
              </div>
              <div className="text-sm text-gray-600">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {collections.reduce((total, c) => total + (c.amenities?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Spots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(collections.reduce((total, c) => total + (c.amenities?.length || 0), 0) / collections.length)}
              </div>
              <div className="text-sm text-gray-600">Avg per Collection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {currentVibe.name}
              </div>
              <div className="text-sm text-gray-600">Vibe Category</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAmenitiesView = () => {
    const currentVibe = getCurrentVibe();
    const currentCollection = getCurrentCollection();

    if (!currentVibe || !currentCollection) return null;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={handleBackToCollections}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Collections
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentCollection.emoji}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentCollection.name}</h1>
                <p className="text-lg text-gray-600">{currentCollection.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities List */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Amenities in {currentCollection.name}
              </h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentCollection.amenities.length} spots
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCollection.amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {amenity.replace(/-/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Amenity #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-gray-900">
              Vibe Navigation Demo
            </h1>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Current: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
              </span>
              
              <a
                href="/vibe/explore"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Live Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'vibes' && renderVibesView()}
        {viewMode === 'collections' && renderCollectionsView()}
        {viewMode === 'amenities' && renderAmenitiesView()}
      </div>
    </div>
  );
}

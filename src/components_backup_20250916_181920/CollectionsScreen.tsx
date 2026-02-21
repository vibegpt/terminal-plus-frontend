import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CollectionCard, CollectionCardCompact } from './ui/CollectionCard';
import { getCollectionsForVibe, VIBES } from '../constants/vibeDefinitions';
import { cn } from '../lib/utils';

interface CollectionsScreenProps {
  className?: string;
}

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({
  className
}) => {
  const navigate = useNavigate();
  const { vibeSlug } = useParams<{ vibeSlug: string }>();
  const [collections, setCollections] = useState<any[]>([]);
  const [currentVibe, setCurrentVibe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (vibeSlug) {
      loadCollections(vibeSlug);
    }
  }, [vibeSlug]);

  const loadCollections = (slug: string) => {
    setIsLoading(true);
    
    // Find the vibe
    const vibe = VIBES.find(v => v.slug === slug);
    if (vibe) {
      setCurrentVibe(vibe);
      
      // Get collections for this vibe
      const vibeCollections = getCollectionsForVibe(slug);
      setCollections(vibeCollections);
    }
    
    setIsLoading(false);
  };

  const handleCollectionClick = (collectionSlug: string) => {
    if (vibeSlug) {
      // Navigate to collection detail page
      navigate(`/collection/${vibeSlug}/${collectionSlug}`);
    }
  };

  const handleBackToVibes = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentVibe || collections.length === 0) {
    return (
      <div className={cn('text-center p-8', className)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vibe Not Found</h2>
        <p className="text-gray-600 mb-6">The vibe you're looking for doesn't exist.</p>
        <button
          onClick={handleBackToVibes}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Vibes
        </button>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToVibes}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-3xl">{currentVibe.emoji}</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentVibe.name}</h1>
                  <p className="text-gray-600">{currentVibe.subtitle}</p>
                </div>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description */}
        {currentVibe.description && (
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {currentVibe.description}
            </p>
          </div>
        )}

        {/* Collections */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : (
          <div className="space-y-4">
            {collections.map((collection) => (
              <CollectionCardCompact
                key={collection.slug}
                collection={collection}
                onClick={() => handleCollectionClick(collection.slug)}
                showCount={true}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
    </div>
  );
};

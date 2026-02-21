import React from 'react';
import { useParams } from 'react-router-dom';
import CollectionDetailSmart7 from './CollectionDetailSmart7';

const CollectionRouteWrapper: React.FC = () => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  
  if (!collectionSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Collection Not Found
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Unable to determine collection ID from URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <CollectionDetailSmart7 collectionId={collectionSlug} />;
};

export default CollectionRouteWrapper;

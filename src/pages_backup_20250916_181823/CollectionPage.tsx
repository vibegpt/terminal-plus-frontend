import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, MapPin } from 'lucide-react';
import { useSmart7WithCollections } from '../hooks/useSmart7WithCollections';

export const CollectionPage: React.FC = () => {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  
  const { 
    collection,
    smart7Items,
    loading,
    refreshSelection 
  } = useSmart7WithCollections({
    collectionSlug: collectionSlug!,
    terminal: 'T3' // Get from context or user selection
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{collection?.name}</h1>
              <p className="text-sm text-gray-500">
                AI-curated • {smart7Items.length} spots
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Smart7 Amenities List */}
      <div className="p-4 space-y-3">
        {smart7Items.map((amenity, index) => (
          <button
            key={amenity.id}
            onClick={() => navigate(`/amenity/${amenity.amenity_slug}`)}
            className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4"
          >
            <div className="flex items-start gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              
              {/* Content */}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {amenity.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {amenity.description}
                </p>
                
                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {amenity.terminal_code}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    5 min walk
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {amenity.price_level}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CollectionPage;

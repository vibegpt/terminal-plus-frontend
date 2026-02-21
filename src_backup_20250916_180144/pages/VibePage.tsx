import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '../main';

export const VibePage: React.FC = () => {
  const { vibeId } = useParams();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollectionsForVibe();
  }, [vibeId]);

  const loadCollectionsForVibe = async () => {
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .contains('vibe_tags', [vibeId])
        .limit(20);
      
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading vibe collections:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-xl font-bold capitalize">{vibeId} Collections</h1>
              <p className="text-sm text-gray-500">
                {collections.length} collections found
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Collections Grid */}
      <div className="p-4">
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => navigate(`/collection/${collection.collection_id}`)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 text-left"
              >
                <div className="text-3xl mb-3">{collection.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {collection.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {collection.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{collection.total_amenities || 0} spots</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">😕</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Collections Found</h3>
            <p className="text-gray-600">No collections found for this vibe</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VibePage;

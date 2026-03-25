import React from 'react';
import { useParams } from 'react-router-dom';

const CollectionDetailTest: React.FC = () => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-white mb-6">
            🎉 Navigation Fixed!
          </h1>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Collection: {collectionSlug}
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              This is a test page to verify that navigation is working correctly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                <h3 className="text-lg font-medium text-white mb-2">✅ Route Working</h3>
                <p className="text-gray-300">Navigation is functional</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                <h3 className="text-lg font-medium text-white mb-2">✅ Params Extracted</h3>
                <p className="text-gray-300">URL parameters are accessible</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                <h3 className="text-lg font-medium text-white mb-2">✅ Component Rendering</h3>
                <p className="text-gray-300">React components are mounting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailTest;

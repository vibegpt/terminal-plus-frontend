import React, { useState } from 'react';
import CollectionDetailSmart7 from '../components/CollectionDetailSmart7';

const CollectionDetailSmart7Demo: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState('hawker-heaven');
  
  // Demo collections with descriptions
  const demoCollections = [
    {
      id: 'hawker-heaven',
      name: 'Hawker Heaven',
      description: '80+ local food stalls serving authentic Singapore cuisine'
    },
    {
      id: 'lounge-life',
      name: 'Lounge Life',
      description: 'Premium spaces without premium prices - rest and refresh'
    },
    {
      id: 'coffee-worth-walk',
      name: 'Coffee Worth Walking For',
      description: 'Best brews in the terminal, from local to international'
    },
    {
      id: 'hidden-gems',
      name: 'Hidden Gems',
      description: 'Secret spots most travelers miss - discover the unexpected'
    },
    {
      id: 'duty-free-deals',
      name: 'Duty-Free Deals',
      description: 'Best prices on luxury goods and local treasures'
    },
    {
      id: '24-7-heroes',
      name: '24/7 Heroes',
      description: 'Always open when you need them - reliable options'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Collection Selector */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🧠 Smart 7 Algorithm Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select a collection to see intelligent amenity recommendations
            </p>
          </div>
          
          {/* Collection Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {demoCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCollection === collection.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {collection.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart 7 Collection Detail */}
      <CollectionDetailSmart7
        collectionId={selectedCollection}
        collectionName={demoCollections.find(c => c.id === selectedCollection)?.name}
        collectionDescription={demoCollections.find(c => c.id === selectedCollection)?.description}
      />
    </div>
  );
};

export default CollectionDetailSmart7Demo;

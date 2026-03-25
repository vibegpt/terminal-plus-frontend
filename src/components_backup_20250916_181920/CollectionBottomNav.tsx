import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QUICK_COLLECTIONS = [
  { id: 'quick-bites', icon: '🏃', name: 'Quick' },
  { id: 'coffee-worth-walk', icon: '☕', name: 'Coffee' },
  { id: 'lounges-affordable', icon: '🛋️', name: 'Lounge' },
  { id: 'singapore-exclusives', icon: '🇸🇬', name: 'Local' },
];

export const CollectionBottomNav: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50"
    >
      <div className="flex justify-around">
        {QUICK_COLLECTIONS.map(collection => (
          <button
            key={collection.id}
            onClick={() => navigate(`/collection/${collection.id}`)}
            className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all"
          >
            <span className="text-2xl mb-1">{collection.icon}</span>
            <span className="text-xs text-gray-600">{collection.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

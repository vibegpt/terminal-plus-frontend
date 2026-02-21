import React from 'react';
import { motion } from 'framer-motion';

interface Amenity {
  id: number;
  name: string;
  amenity_slug: string;
  terminal_code: string;
  price_level: string;
  vibe_tags: string;
  description: string;
  smart7_score?: number;
  is_featured?: boolean;
}

interface CollectionGridProps {
  amenities: Amenity[];
  onAmenityClick: (amenity: Amenity) => void;
  className?: string;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  amenities,
  onAmenityClick,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {amenities.map((amenity, index) => (
        <motion.div
          key={amenity.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: index * 0.05,
            type: 'spring',
            stiffness: 300
          }}
          onClick={() => onAmenityClick(amenity)}
          className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
        >
          {/* Rank Badge */}
          <div className="absolute top-3 left-3 z-10 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {index + 1}
          </div>

          {/* Featured Star */}
          {amenity.is_featured && (
            <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              ⭐ TOP
            </div>
          )}

          {/* Content */}
          <div className="p-6 pt-16">
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {amenity.name}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {amenity.description}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span>{amenity.terminal_code}</span>
              <span>•</span>
              <span>{amenity.price_level}</span>
            </div>

            {/* Vibe Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {amenity.vibe_tags?.split(',').slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>

            {/* Smart7 Score */}
            {amenity.smart7_score && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Smart7 Score</span>
                  <span className="text-xs font-medium text-gray-700">
                    {amenity.smart7_score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${amenity.smart7_score}%` }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

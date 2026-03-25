import React from 'react';
import type { AmenityLocation } from '../types/amenity.types';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface RecommendationSectionProps {
  recommendations: AmenityLocation[];
  className?: string;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({ recommendations, className = '' }) => {
  if (!recommendations || recommendations.length === 0) return null;
  const topRecs = recommendations.slice(0, 8);

  // Helper to get displayable hours
  const getDisplayHours = (hours: any): string => {
    if (!hours) return 'Hours not available';
    if (typeof hours === 'string') return hours;
    if (typeof hours === 'object') {
      const now = new Date();
      const day = now.toLocaleString('en-US', { weekday: 'long' });
      return hours[day] || hours['Monday-Sunday'] || 'Hours not available';
    }
    return 'Hours not available';
  };

  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Recommended for You</h2>
      <Swiper
        spaceBetween={24}
        slidesPerView={1}
        centeredSlides
        className="w-full max-w-md"
      >
        {topRecs.map((amenity) => (
          <SwiperSlide key={amenity.id}>
            <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-lg bg-white flex-shrink-0 cursor-pointer group">
              {/* Image */}
              <img
                src={amenity.image_url || amenity.image || '/placeholder.jpg'}
                alt={amenity.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                <div className="mb-2">
                  <span className="text-white text-lg font-bold drop-shadow">
                    {amenity.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-sm">
                    {getDisplayHours(amenity.hours)}
                  </span>
                </div>
                {amenity.description && (
                  <div className="text-white text-xs line-clamp-3 drop-shadow mb-1">
                    {amenity.description}
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="flex justify-center mt-6">
        <button
          className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-md text-lg opacity-80 hover:opacity-100 transition"
          disabled
        >
          Open Real-Time Map & Navigation (Coming Soon)
        </button>
      </div>
    </section>
  );
}; 
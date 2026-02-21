import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

interface Collection {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  amenity_count: number;
  vibe: string;
}

interface MobileCollectionsProps {
  collections: Collection[];
  onCollectionClick?: (collection: Collection) => void;
  title?: string;
  showPagination?: boolean;
  autoplay?: boolean;
  className?: string;
}

export function MobileCollections({ 
  collections, 
  onCollectionClick,
  title,
  showPagination = true,
  autoplay = false,
  className = ''
}: MobileCollectionsProps) {
  const handleCollectionClick = (collection: Collection) => {
    onCollectionClick?.(collection);
  };

  if (!collections || collections.length === 0) {
    return (
      <div className={`mobile-collections ${className}`}>
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 mb-4 px-4">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>No collections available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-collections ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-4">
          {title}
        </h2>
      )}
      
      <Swiper
        slidesPerView={1.2}
        spaceBetween={16}
        freeMode={true}
        pagination={showPagination ? { 
          clickable: true,
          dynamicBullets: true,
          dynamicMainBullets: 3
        } : false}
        modules={[FreeMode, Pagination, ...(autoplay ? [Autoplay] : [])]}
        autoplay={autoplay ? {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        } : false}
        className="w-full"
        breakpoints={{
          640: { 
            slidesPerView: 2.2,
            spaceBetween: 20
          },
          768: { 
            slidesPerView: 3.2,
            spaceBetween: 24
          },
          1024: {
            slidesPerView: 4.2,
            spaceBetween: 24
          }
        }}
        grabCursor={true}
        touchRatio={1}
        touchAngle={45}
        threshold={5}
        longSwipesRatio={0.5}
        longSwipesMs={300}
        followFinger={true}
        preventClicks={false}
        preventClicksPropagation={false}
        allowTouchMove={true}
        resistance={true}
        resistanceRatio={0.85}
      >
        {collections.map((collection) => (
          <SwiperSlide key={collection.id}>
            <CollectionCard 
              collection={collection} 
              onClick={() => handleCollectionClick(collection)}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// Collection Card Component
interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <div 
      className="collection-card cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
        {collection.image_url ? (
          <img 
            src={collection.image_url} 
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {collection.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Vibe Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
            {collection.vibe}
          </span>
        </div>
        
        {/* Amenity Count */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {collection.amenity_count} places
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
          {collection.name}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2">
          {collection.description}
        </p>
      </div>
    </div>
  );
}

export default MobileCollections;

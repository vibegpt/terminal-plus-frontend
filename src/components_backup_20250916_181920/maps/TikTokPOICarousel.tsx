import React from 'react';

interface POI {
  id: string;
  name: string;
  type: string;
  vibe?: string;
  logo_url?: string;
}

interface TikTokPOICarouselProps {
  poiList: POI[];
  onSelectPOI: (poi: POI) => void;
}

const TikTokPOICarousel: React.FC<TikTokPOICarouselProps> = ({ poiList, onSelectPOI }) => {
  return (
    <div className="absolute bottom-0 w-full overflow-x-auto flex gap-4 p-4 bg-gradient-to-t from-white/90 to-transparent z-10">
      {poiList.map(poi => (
        <div
          key={poi.id}
          className="min-w-[220px] bg-white rounded-xl shadow-lg p-4 flex-shrink-0 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => onSelectPOI(poi)}
        >
          {poi.logo_url && (
            <img
              src={poi.logo_url}
              alt={poi.name}
              className="w-16 h-16 object-contain rounded-md mb-2"
            />
          )}
          <h4 className="font-semibold text-base leading-tight mb-1">{poi.name}</h4>
          <p className="text-xs text-gray-500 mb-1 capitalize">{poi.type}</p>
          {poi.vibe && (
            <span className="text-xs rounded-full bg-black text-white px-2 py-0.5">
              {poi.vibe}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TikTokPOICarousel; 
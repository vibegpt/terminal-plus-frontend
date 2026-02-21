import React, { useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import AmenityCard from "./AmenityCard";
import { useAmenities } from "@/hooks/useAmenities";
import { normalizeAmenity, toSlug } from "@/utils/normalizeAmenity";

// Enhanced vibe color mapping with glow effects
const vibeColors: Record<string, { bg: string; text: string; glow: string; pin: string }> = {
  Refuel: { 
    bg: "bg-orange-500", 
    text: "text-white", 
    glow: "shadow-orange-500/50",
    pin: "🍔"
  },
  Comfort: { 
    bg: "bg-blue-500", 
    text: "text-white", 
    glow: "shadow-blue-500/50",
    pin: "🛋️"
  },
  Quick: { 
    bg: "bg-yellow-500", 
    text: "text-yellow-900", 
    glow: "shadow-yellow-500/50",
    pin: "⚡"
  },
  Explore: { 
    bg: "bg-purple-500", 
    text: "text-white", 
    glow: "shadow-purple-500/50",
    pin: "🔍"
  },
  Work: { 
    bg: "bg-green-500", 
    text: "text-white", 
    glow: "shadow-green-500/50",
    pin: "💼"
  },
  Shop: { 
    bg: "bg-pink-500", 
    text: "text-white", 
    glow: "shadow-pink-500/50",
    pin: "🛍️"
  },
  Chill: { 
    bg: "bg-teal-500", 
    text: "text-white", 
    glow: "shadow-teal-500/50",
    pin: "😌"
  },
  refuel: { 
    bg: "bg-orange-500", 
    text: "text-white", 
    glow: "shadow-orange-500/50",
    pin: "🍔"
  },
  comfort: { 
    bg: "bg-blue-500", 
    text: "text-white", 
    glow: "shadow-blue-500/50",
    pin: "🛋️"
  },
  quick: { 
    bg: "bg-yellow-500", 
    text: "text-yellow-900", 
    glow: "shadow-yellow-500/50",
    pin: "⚡"
  },
  explore: { 
    bg: "bg-purple-500", 
    text: "text-white", 
    glow: "shadow-purple-500/50",
    pin: "🔍"
  },
  work: { 
    bg: "bg-green-500", 
    text: "text-white", 
    glow: "shadow-green-500/50",
    pin: "💼"
  },
  shop: { 
    bg: "bg-pink-500", 
    text: "text-white", 
    glow: "shadow-pink-500/50",
    pin: "🛍️"
  },
  chill: { 
    bg: "bg-teal-500", 
    text: "text-white", 
    glow: "shadow-teal-500/50",
    pin: "😌"
  },
};

type Amenity = {
  id: string;
  name: string;
  category: string;
  vibe: string;
  imageUrl: string;
  logoUrl?: string;
  rating: number;
  openHours: string;
  terminal: string;
  walkTime: string;
  slug: string;
  coordinates?: { lat: number; lng: number };
  position: { x: number; y: number };
};

export default function EnhancedTerminalMapView() {
  const [selectedVibe, setSelectedVibe] = useState<string>("all");
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);

  // Use the proper amenity loading hook
  const { data: allAmenities, isLoading: isAmenitiesLoading } = useAmenities();

  // Transform amenities data with positioning
  const amenities: Amenity[] = useMemo(() => {
    if (!allAmenities || isAmenitiesLoading) {
      return [];
    }

    return allAmenities.slice(0, 12).map((amenity, index) => {
      const normalized = normalizeAmenity(amenity);
      
      // Create a grid-like positioning for pins
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = 15 + (col * 20) + (Math.random() * 10);
      const y = 20 + (row * 25) + (Math.random() * 15);
      
      return {
        id: amenity.id || amenity.name,
        name: amenity.name,
        category: amenity.category || "Restaurant",
        vibe: amenity.vibe_tags?.[0] || "Refuel",
        imageUrl: amenity.image_url || "/images/default-amenity.jpg",
        logoUrl: amenity.logo_url,
        rating: amenity.rating || 4.5,
        openHours: amenity.opening_hours ? 
          (typeof amenity.opening_hours === 'string' ? 
            amenity.opening_hours : 
            amenity.opening_hours["Monday-Sunday"] || "9am–9pm") : 
          "9am–9pm",
        terminal: amenity.terminal_code || "T1",
        walkTime: `${Math.floor(Math.random() * 8) + 2} min walk`,
        slug: amenity.slug || toSlug(amenity.name),
        coordinates: amenity.coordinates ? {
          lat: amenity.coordinates.lat || 0,
          lng: amenity.coordinates.lng || 0
        } : undefined,
        position: { x, y }
      };
    });
  }, []);

  // Filter amenities by selected vibe
  const filteredAmenities = useMemo(() => {
    if (selectedVibe === "all") return amenities;
    return amenities.filter(amenity => 
      amenity.vibe.toLowerCase() === selectedVibe.toLowerCase()
    );
  }, [amenities, selectedVibe]);

  const vibes = ["all", "Refuel", "Comfort", "Quick", "Explore", "Work", "Shop", "Chill"];

  return (
    <div className="h-screen bg-white">
      {/* Enhanced Vibe Filter Chips - TikTok Style */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {vibes.map((vibe) => {
            const isSelected = selectedVibe === vibe;
            const vibeColor = vibeColors[vibe] || vibeColors.Refuel;
            return (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(vibe)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? `${vibeColor.bg} ${vibeColor.text} shadow-lg ${vibeColor.glow}`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {vibe === "all" ? "All Places" : vibe}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Map Container */}
      <div className="relative h-full">
        {/* Terminal Map Background */}
        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 relative">
          {/* Terminal Layout Overlay */}
          <div className="absolute inset-0">
            {/* Terminal Gates */}
            <div className="absolute top-4 left-4 text-xs text-gray-600 font-medium">
              <div className="mb-2">🛫 Gates A1-A10</div>
              <div className="mb-2">🛫 Gates B1-B15</div>
              <div>🛫 Gates C1-C8</div>
            </div>
            
            {/* Terminal Zones */}
            <div className="absolute top-4 right-4 text-xs text-gray-600">
              <div className="mb-2">🛍️ Retail Zone</div>
              <div className="mb-2">🍽️ Food Court</div>
              <div>🛋️ Lounge Area</div>
            </div>
          </div>

          {/* Enhanced Custom Pins Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredAmenities.map((amenity) => {
              const vibeColor = vibeColors[amenity.vibe] || vibeColors.Refuel;
              
              return (
                <div
                  key={amenity.id}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${amenity.position.x}%`, 
                    top: `${amenity.position.y}%` 
                  }}
                  onClick={() => setSelectedAmenity(amenity)}
                >
                  {/* Enhanced Custom Pin */}
                  <div className={`w-14 h-14 rounded-full ${vibeColor.bg} ${vibeColor.text} flex items-center justify-center shadow-lg ${vibeColor.glow} hover:scale-110 transition-all duration-200 border-2 border-white`}>
                    <span className="text-xl">
                      {vibeColor.pin}
                    </span>
                  </div>
                  
                  {/* Enhanced Pin Label */}
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-2 shadow-lg text-xs font-medium whitespace-nowrap border border-gray-200">
                    <div className="font-semibold">{amenity.name}</div>
                    <div className="text-gray-500">{amenity.walkTime}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Selected Amenity Preview Bubble - TikTok Style */}
          {selectedAmenity && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-2xl p-4 w-80 max-w-sm border border-gray-200">
              <div className="relative">
                <img
                  src={selectedAmenity.imageUrl}
                  alt={selectedAmenity.name}
                  className="h-32 w-full object-cover rounded-xl mb-3"
                />
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${vibeColors[selectedAmenity.vibe]?.bg} ${vibeColors[selectedAmenity.vibe]?.text}`}>
                  {selectedAmenity.vibe}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{selectedAmenity.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{"⭐".repeat(Math.floor(selectedAmenity.rating))}</span>
                  <span>{selectedAmenity.rating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{selectedAmenity.walkTime}</span>
                </div>
                <p className="text-sm text-gray-500">{selectedAmenity.category}</p>
                
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 bg-fuchsia-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-fuchsia-700 transition-colors">
                    View Details
                  </button>
                  <button 
                    onClick={() => setSelectedAmenity(null)}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Horizontal Carousel - TikTok Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200">
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {selectedVibe === "all" ? "All Places" : `${selectedVibe} Places`} ({filteredAmenities.length})
          </h3>
          
          <Swiper
            spaceBetween={16}
            slidesPerView={1.2}
            className="amenity-swiper"
          >
            {filteredAmenities.map((amenity) => (
              <SwiperSlide key={amenity.id}>
                <AmenityCard
                  name={amenity.name}
                  category={amenity.category}
                  vibe={amenity.vibe}
                  imageUrl={amenity.imageUrl}
                  logoUrl={amenity.logoUrl}
                  rating={amenity.rating}
                  openHours={amenity.openHours}
                  terminal={amenity.terminal}
                  walkTime={amenity.walkTime}
                  slug={amenity.slug}
                  isDraggable={false}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
} 
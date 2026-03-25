import React, { useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import AmenityCard from "../AmenityCard";
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

interface EnhancedTerminalMapProps {
  terminal?: string;
  showPathToGate?: boolean;
  gate?: string;
  timeToGateDisplay?: boolean;
}

export default function EnhancedTerminalMap({ 
  terminal = "T1", 
  showPathToGate = false,
  gate,
  timeToGateDisplay = false
}: EnhancedTerminalMapProps) {
  // Use the proper amenity loading hook
  const { data: allAmenities, isLoading: isAmenitiesLoading } = useAmenities();

  // Transform amenities data
  const amenities: Amenity[] = useMemo(() => {
    if (!allAmenities || isAmenitiesLoading) {
      return [];
    }

    // Filter amenities by terminal
    const terminalAmenities = allAmenities.filter(amenity => 
      amenity.terminal_code === terminal || !terminal
    );

    return terminalAmenities.slice(0, 10).map((amenity, index) => {
      const normalized = normalizeAmenity(amenity);
              return {
          id: amenity.id || amenity.name || `amenity-${index}`,
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
        walkTime: "5 min",
        slug: toSlug(amenity.name),
        coordinates: {
          lat: -33.9399 + (Math.random() - 0.5) * 0.01,
          lng: 151.1753 + (Math.random() - 0.5) * 0.01,
        },
        position: {
          x: Math.random() * 800,
          y: Math.random() * 600,
        },
      };
    });
  }, []);

  // Filter amenities by terminal
  const filteredAmenities = useMemo(() => {
    return amenities.filter(amenity => {
      const matchesTerminal = !terminal || amenity.terminal === terminal;
      return matchesTerminal;
    });
  }, [amenities, terminal]);

  return (
    <div className="space-y-6">
      {/* Terminal Layout Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Terminal {terminal} Layout</h3>
            <p className="text-sm text-slate-600">Detailed view with amenities and navigation</p>
          </div>
          {showPathToGate && gate && (
            <div className="text-right">
              <div className="text-sm font-semibold text-blue-600">Gate {gate}</div>
              {timeToGateDisplay && (
                <div className="text-xs text-slate-500">~8 min walk</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Terminal Map Visualization */}
      <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <div className="relative w-full h-80 bg-white dark:bg-slate-800 rounded-lg shadow-inner overflow-hidden">
          {/* Terminal Layout */}
          <div className="absolute inset-0 p-4">
            <div className="w-full h-full border-2 border-gray-300 rounded-lg relative">
              {/* Gate indicators */}
              {showPathToGate && gate && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Gate {gate}
                </div>
              )}
              
              {/* Amenity pins */}
              {filteredAmenities.slice(0, 8).map((amenity, index) => (
                <div
                  key={amenity.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${20 + (index % 4) * 20}%`,
                    top: `${20 + Math.floor(index / 4) * 30}%`,
                  }}
                  title={amenity.name}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${vibeColors[amenity.vibe]?.bg || vibeColors.Refuel.bg}`}>
                    {vibeColors[amenity.vibe]?.pin || "🍔"}
                  </div>
                </div>
              ))}
              
              {/* Path to gate */}
              {showPathToGate && gate && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path
                      d="M 20 50 Q 50 30 80 50"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amenity Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Terminal {terminal} Amenities</h3>
          <p className="text-sm text-slate-600">All available services and facilities</p>
        </div>
        
        <Swiper
          spaceBetween={16}
          slidesPerView={1.2}
          className="amenity-swiper p-4"
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
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Navigation Info */}
      {showPathToGate && gate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Path to Gate {gate}</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Follow the blue dotted line to your departure gate
              </p>
            </div>
            {timeToGateDisplay && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">8 min</div>
                <div className="text-xs text-blue-500">estimated walk</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
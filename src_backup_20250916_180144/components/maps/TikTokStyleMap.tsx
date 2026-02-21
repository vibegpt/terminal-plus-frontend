import React, { useState, useMemo } from "react";
import { GoogleMap, Marker, useLoadScript, InfoWindow } from "@react-google-maps/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import AmenityCard from "../AmenityCard";
import TikTokPOICarousel from "./TikTokPOICarousel";
import { useAmenities } from "@/hooks/useAmenities";
import { normalizeAmenity, toSlug } from "@/utils/normalizeAmenity";

// Google Maps configuration
const containerStyle = {
  width: "100%",
  height: "60vh",
  borderRadius: "1rem",
};

// Sydney Airport coordinates
const center = {
  lat: -33.9399,
  lng: 151.1753,
};

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
  coordinates: { lat: number; lng: number };
};

interface TikTokStyleMapProps {
  terminal?: string;
  vibe?: string;
  gate?: string;
  poiList?: Amenity[];
}

export default function TikTokStyleMap({
  terminal = "T1",
  vibe = "Refuel",
  gate,
  poiList
}: TikTokStyleMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key",
  });

  // Use the proper amenity loading hook
  const { data: allAmenities, isLoading: isAmenitiesLoading } = useAmenities();

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // Transform amenities data
  const amenities: Amenity[] = useMemo(() => {
    if (poiList) {
      return poiList;
    }

    if (!allAmenities || isAmenitiesLoading) {
      return [];
    }

    // Filter amenities by terminal and normalize them
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
      };
    });
  }, [poiList, allAmenities, isAmenitiesLoading, terminal]);

  // Filter amenities by terminal and vibe
  const filteredAmenities = useMemo(() => {
    return amenities.filter(amenity => {
      const matchesTerminal = !terminal || amenity.terminal === terminal;
      const matchesVibe = !vibe || amenity.vibe.toLowerCase() === vibe.toLowerCase();
      return matchesTerminal && matchesVibe;
    });
  }, [amenities, terminal, vibe]);

  // Convert amenities to POI format for carousel
  const poiListForCarousel = useMemo(() => {
    return filteredAmenities.slice(0, 6).map(amenity => ({
      id: amenity.id,
      name: amenity.name,
      type: amenity.category,
      vibe: amenity.vibe,
      logo_url: amenity.logoUrl
    }));
  }, [filteredAmenities]);

  const handlePOISelect = (poi: any) => {
    const selectedAmenity = filteredAmenities.find(a => a.id === poi.id);
    if (selectedAmenity) {
      setSelectedAmenity(selectedAmenity);
      setShowInfoWindow(true);
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-60 bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">🗺️</div>
          <p className="text-red-600 font-semibold">Error loading map</p>
          <p className="text-red-500 text-sm">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-60 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-600 font-semibold">Loading map...</p>
        </div>
      </div>
    );
  }

  const vibeColor = vibeColors[vibe] || vibeColors.Refuel;

  return (
    <div className="space-y-4">
      {/* TikTok-Style Swiper */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Quick {vibe} Picks</h3>
          <p className="text-sm text-slate-600">Swipe through vibe-matched recommendations</p>
        </div>

        <Swiper
          spaceBetween={16}
          slidesPerView={1.2}
          className="amenity-swiper p-4"
        >
          {filteredAmenities.slice(0, 6).map((amenity) => (
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

      {/* Interactive Map with TikTok Carousel */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Interactive Terminal Map</h3>
          <p className="text-sm text-slate-600">Real-time location and vibe-based pins</p>
        </div>

        <div className="relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={16}
            options={{
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {filteredAmenities.map((amenity) => (
              <Marker
                key={amenity.id}
                position={amenity.coordinates}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setShowInfoWindow(true);
                }}
                icon={{
                  url: `data:image/svg+xml;base64,${btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="${vibeColor.bg.replace('bg-', '#')}" stroke="white" stroke-width="2"/>
                      <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${vibeColor.pin}</text>
                    </svg>
                  `)}`,
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />
            ))}

            {showInfoWindow && selectedAmenity && (
              <InfoWindow
                position={selectedAmenity.coordinates}
                onCloseClick={() => {
                  setShowInfoWindow(false);
                  setSelectedAmenity(null);
                }}
              >
                <div className="p-3 max-w-xs">
                  <h3 className="font-semibold text-sm mb-1">{selectedAmenity.name}</h3>
                  <p className="text-xs text-slate-600 mb-2">{selectedAmenity.category}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-xs">{selectedAmenity.rating}</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>🕒 {selectedAmenity.openHours}</p>
                    <p>🚶 {selectedAmenity.walkTime} walk</p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* TikTok POI Carousel */}
          <TikTokPOICarousel
            poiList={poiListForCarousel}
            onSelectPOI={handlePOISelect}
          />
        </div>
      </div>
    </div>
  );
} 
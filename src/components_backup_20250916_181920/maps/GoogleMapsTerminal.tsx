import React, { useState, useMemo } from "react";
import { GoogleMap, Marker, useLoadScript, InfoWindow } from "@react-google-maps/api";

// Google Maps configuration
const containerStyle = {
  width: "100%",
  height: "70vh",
  borderRadius: "1rem",
};

// Singapore Changi Airport coordinates
const center = {
  lat: 1.3644,
  lng: 103.9915,
};

// Enhanced vibe color mapping with proper hex colors
const vibeColors: Record<string, { bg: string; text: string; glow: string; pin: string; hex: string }> = {
  Refuel: { 
    bg: "bg-orange-500", 
    text: "text-white", 
    glow: "shadow-orange-500/50",
    pin: "🍔",
    hex: "#f97316"
  },
  Comfort: { 
    bg: "bg-blue-500", 
    text: "text-white", 
    glow: "shadow-blue-500/50",
    pin: "🛋️",
    hex: "#3b82f6"
  },
  Quick: { 
    bg: "bg-yellow-500", 
    text: "text-yellow-900", 
    glow: "shadow-yellow-500/50",
    pin: "⚡",
    hex: "#eab308"
  },
  Explore: { 
    bg: "bg-purple-500", 
    text: "text-white", 
    glow: "shadow-purple-500/50",
    pin: "🔍",
    hex: "#a855f7"
  },
  Work: { 
    bg: "bg-green-500", 
    text: "text-white", 
    glow: "shadow-green-500/50",
    pin: "💼",
    hex: "#22c55e"
  },
  Shop: { 
    bg: "bg-pink-500", 
    text: "text-white", 
    glow: "shadow-pink-500/50",
    pin: "🛍️",
    hex: "#ec4899"
  },
  Chill: { 
    bg: "bg-teal-500", 
    text: "text-white", 
    glow: "shadow-teal-500/50",
    pin: "😌",
    hex: "#14b8a6"
  },
  Grind: { 
    bg: "bg-indigo-500", 
    text: "text-white", 
    glow: "shadow-indigo-500/50",
    pin: "💪",
    hex: "#6366f1"
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

interface GoogleMapsTerminalProps {
  terminal?: string;
  vibe?: string;
  filters?: string[];
}

export default function GoogleMapsTerminal({ 
  terminal = "T3", 
  vibe = "Refuel",
  filters = []
}: GoogleMapsTerminalProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key",
  });

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // Mock amenities data - in real app this would come from API
  const amenities: Amenity[] = useMemo(() => {
    const mockAmenities = [
      {
        id: "1",
        name: "Ya Kun Kaya Toast",
        category: "Food",
        vibe: "Refuel",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.3,
        openHours: "6am–10pm",
        terminal: "T3",
        walkTime: "2 min",
        slug: "ya-kun-kaya-toast",
        coordinates: { lat: 1.3644 + 0.002, lng: 103.9915 + 0.001 },
      },
      {
        id: "2",
        name: "Ambassador Transit Lounge",
        category: "Lounge",
        vibe: "Comfort",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.6,
        openHours: "24/7",
        terminal: "T3",
        walkTime: "4 min",
        slug: "ambassador-transit-lounge",
        coordinates: { lat: 1.3644 - 0.001, lng: 103.9915 + 0.002 },
      },
      {
        id: "3",
        name: "DFS Duty Free",
        category: "Shopping",
        vibe: "Shop",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.1,
        openHours: "8am–11pm",
        terminal: "T3",
        walkTime: "3 min",
        slug: "dfs-duty-free",
        coordinates: { lat: 1.3644 + 0.001, lng: 103.9915 - 0.001 },
      },
      {
        id: "4",
        name: "Business Center",
        category: "Services",
        vibe: "Work",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.2,
        openHours: "24/7",
        terminal: "T3",
        walkTime: "5 min",
        slug: "business-center",
        coordinates: { lat: 1.3644 - 0.002, lng: 103.9915 - 0.002 },
      },
      {
        id: "5",
        name: "Food Republic",
        category: "Food",
        vibe: "Quick",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.0,
        openHours: "6am–12am",
        terminal: "T3",
        walkTime: "1 min",
        slug: "food-republic",
        coordinates: { lat: 1.3644 + 0.003, lng: 103.9915 + 0.003 },
      },
      {
        id: "6",
        name: "Butterfly Garden",
        category: "Attraction",
        vibe: "Explore",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.7,
        openHours: "6am–12am",
        terminal: "T3",
        walkTime: "8 min",
        slug: "butterfly-garden",
        coordinates: { lat: 1.3644 - 0.003, lng: 103.9915 + 0.004 },
      },
      {
        id: "7",
        name: "Snooze Lounge",
        category: "Rest",
        vibe: "Chill",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.4,
        openHours: "24/7",
        terminal: "T3",
        walkTime: "6 min",
        slug: "snooze-lounge",
        coordinates: { lat: 1.3644 + 0.001, lng: 103.9915 - 0.003 },
      },
    ];

    return mockAmenities;
  }, []);

  // Filter amenities by terminal, vibe, and category filters
  const filteredAmenities = useMemo(() => {
    return amenities.filter(amenity => {
      const matchesTerminal = !terminal || amenity.terminal === terminal;
      const matchesVibe = !vibe || amenity.vibe.toLowerCase() === vibe.toLowerCase();
      const matchesFilters = filters.length === 0 || filters.includes(amenity.category);
      return matchesTerminal && matchesVibe && matchesFilters;
    });
  }, [amenities, terminal, vibe, filters]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-80 bg-red-50 rounded-lg">
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
      <div className="flex items-center justify-center h-80 bg-blue-50 rounded-lg">
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
      {/* Map Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Terminal {terminal} Map</h3>
            <p className="text-sm text-slate-600">
              {vibe} vibe • {filteredAmenities.length} locations found
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">{filteredAmenities.length}</div>
            <div className="text-xs text-slate-500">POIs</div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
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
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {filteredAmenities.map((amenity) => {
            const amenityVibeColor = vibeColors[amenity.vibe] || vibeColors.Refuel;
            return (
              <Marker
                key={amenity.id}
                position={amenity.coordinates}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setShowInfoWindow(true);
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: amenityVibeColor.hex,
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 12,
                }}
              />
            );
          })}

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
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{filteredAmenities.length}</div>
            <div className="text-xs text-slate-500">Locations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{vibe}</div>
            <div className="text-xs text-slate-500">Vibe</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{terminal}</div>
            <div className="text-xs text-slate-500">Terminal</div>
          </div>
        </div>
      </div>
    </div>
  );
} 
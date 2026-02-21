import React, { useState, useMemo } from "react";
import { GoogleMap, Marker, useLoadScript, InfoWindow } from "@react-google-maps/api";

// Google Maps configuration
const containerStyle = {
  width: "100%",
  height: "70vh",
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
  Grind: { 
    bg: "bg-indigo-500", 
    text: "text-white", 
    glow: "shadow-indigo-500/50",
    pin: "💪"
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
  terminal = "T1", 
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
        name: "Starbucks",
        category: "Food",
        vibe: "Refuel",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.2,
        openHours: "6am–10pm",
        terminal: "T1",
        walkTime: "3 min",
        slug: "starbucks",
        coordinates: { lat: -33.9399 + 0.002, lng: 151.1753 + 0.001 },
      },
      {
        id: "2",
        name: "Lounge Access",
        category: "Lounge",
        vibe: "Comfort",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.5,
        openHours: "24/7",
        terminal: "T1",
        walkTime: "5 min",
        slug: "lounge-access",
        coordinates: { lat: -33.9399 - 0.001, lng: 151.1753 + 0.002 },
      },
      {
        id: "3",
        name: "Duty Free Shop",
        category: "Shopping",
        vibe: "Shop",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.0,
        openHours: "8am–9pm",
        terminal: "T1",
        walkTime: "2 min",
        slug: "duty-free-shop",
        coordinates: { lat: -33.9399 + 0.001, lng: 151.1753 - 0.001 },
      },
      {
        id: "4",
        name: "Work Station",
        category: "Services",
        vibe: "Work",
        imageUrl: "/images/default-amenity.jpg",
        rating: 4.3,
        openHours: "7am–11pm",
        terminal: "T1",
        walkTime: "4 min",
        slug: "work-station",
        coordinates: { lat: -33.9399 - 0.002, lng: 151.1753 - 0.002 },
      },
      {
        id: "5",
        name: "Quick Bite",
        category: "Food",
        vibe: "Quick",
        imageUrl: "/images/default-amenity.jpg",
        rating: 3.8,
        openHours: "6am–10pm",
        terminal: "T1",
        walkTime: "1 min",
        slug: "quick-bite",
        coordinates: { lat: -33.9399 + 0.003, lng: 151.1753 + 0.003 },
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
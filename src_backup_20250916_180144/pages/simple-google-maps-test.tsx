import React, { useState, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { loadAmenitiesByTerminal } from "@/hooks/useAmenities";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -33.9399,
  lng: 151.1753,
};

export default function SimpleGoogleMapsTest() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key",
  });

  const [amenities, setAmenities] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Test data loading
  useEffect(() => {
    async function loadTestData() {
      try {
        console.log("🔍 Testing data loading for SYD-T1...");
        const sydAmenities = await loadAmenitiesByTerminal("SYD-T1");
        console.log("🔍 Loaded SYD-T1 amenities:", sydAmenities.length);
        setAmenities(sydAmenities);
      } catch (error) {
        console.error("🔍 Data loading error:", error);
        setDataError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setDataLoading(false);
      }
    }

    loadTestData();
  }, []);

  console.log("🔍 Simple Google Maps Test:", {
    isLoaded,
    loadError: loadError?.message,
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Set" : "Not Set",
    apiKeyLength: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0,
    amenitiesCount: amenities.length,
    dataLoading,
    dataError
  });

  if (loadError) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Google Maps Load Error</h1>
        <p className="text-red-600">{loadError.message}</p>
        <p className="text-sm text-gray-600 mt-2">API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Set" : "Not Set"}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Google Maps...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Amenities Data...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Data Loading Error</h1>
        <p className="text-red-600">{dataError}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Google Maps + Data Test</h1>
      <p className="text-green-600 mb-4">✅ Google Maps API is working</p>
      <p className="text-green-600 mb-4">✅ Data loading is working ({amenities.length} amenities)</p>
      
      <div className="border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={{
            zoomControl: true,
            panControl: true,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: false
          }}
        >
          {amenities.slice(0, 5).map((amenity, index) => {
            if (!amenity.coordinates || !amenity.coordinates.lat) {
              console.log("🔍 Amenity without coordinates:", amenity.name);
              return null;
            }
            
            return (
              <Marker
                key={amenity.id || `amenity-${index}`}
                position={amenity.coordinates}
                title={amenity.name}
              />
            );
          })}
        </GoogleMap>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <p>API Key Set: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✅ Yes" : "❌ No"}</p>
        <p>API Key Length: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0}</p>
        <p>Map Loaded: ✅ Yes</p>
        <p>Amenities Loaded: {amenities.length}</p>
        <p>Amenities with Coordinates: {amenities.filter(a => a.coordinates && a.coordinates.lat).length}</p>
        <p>Center: {center.lat}, {center.lng}</p>
      </div>
    </div>
  );
} 
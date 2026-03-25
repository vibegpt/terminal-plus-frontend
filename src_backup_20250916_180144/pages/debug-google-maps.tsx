import React from "react";
import { useLoadScript } from "@react-google-maps/api";

export default function DebugGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key",
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Google Maps Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✅ Set" : "❌ Not Set"}</p>
          <p>API Key Length: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">LoadScript Status:</h2>
          <p>Is Loaded: {isLoaded ? "✅ Yes" : "❌ No"}</p>
          <p>Load Error: {loadError ? "❌ Yes" : "✅ No"}</p>
          {loadError && (
            <div className="bg-red-100 p-4 rounded">
              <p className="text-red-800">Error: {loadError.message}</p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Test Map:</h2>
          {isLoaded && !loadError ? (
            <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-600">✅ Google Maps API is working!</p>
            </div>
          ) : (
            <div className="w-full h-64 bg-red-100 rounded flex items-center justify-center">
              <p className="text-red-600">❌ Google Maps API failed to load</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
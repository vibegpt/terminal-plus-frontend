import React from "react";

export default function SimpleTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✅ Set" : "❌ Not Set"}</p>
          <p>API Key Length: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0}</p>
          <p>API Key Preview: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 10)}...</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">React Status:</h2>
          <p>React Version: {React.version}</p>
          <p>Component Loaded: ✅ Yes</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Test Content:</h2>
          <div className="w-full h-64 bg-blue-100 rounded flex items-center justify-center">
            <p className="text-blue-600">✅ This page is working!</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavigationTest() {
  const navigate = useNavigate();
  
  const testRoutes = [
    { path: '/', label: 'Home (Vibe Feed)' },
    { path: '/vibe/discover', label: 'Discover Vibe Collections' },
    { path: '/vibe/chill', label: 'Chill Vibe Collections' },
    { path: '/vibe/shop', label: 'Shop Vibe Collections' },
    { path: '/collection/discover/hidden-gems', label: 'Discover > Hidden Gems (Adaptive Luxe)' },
    { path: '/collection/shop/luxury-boulevard', label: 'Shop > Luxury Boulevard (Adaptive Luxe)' },
    { path: '/collection/chill/coffee-casual', label: 'Chill > Coffee & Casual (Adaptive Luxe)' },
    { path: '/collection/comfort/sleep-solutions', label: 'Comfort > Sleep Solutions (Adaptive Luxe)' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Navigation Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Expected Navigation Flow:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Home Page (/) - Shows all vibes with collections</li>
            <li>Click "See all" on a vibe → Goes to /vibe/[vibeSlug]</li>
            <li>Click a collection card → Goes to /collection/[vibeSlug]/[collectionSlug]</li>
            <li>Collection page shows Adaptive Luxe design</li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Routes:</h2>
          <div className="space-y-2">
            {testRoutes.map((route) => (
              <button
                key={route.path}
                onClick={() => navigate(route.path)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors flex justify-between items-center group"
              >
                <span className="font-medium">{route.label}</span>
                <span className="text-sm text-gray-500 group-hover:text-blue-600">
                  {route.path}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The Adaptive Luxe design should appear on all /collection/* routes with glassmorphic cards, live pulses, and mini-maps.
          </p>
        </div>
      </div>
    </div>
  );
}

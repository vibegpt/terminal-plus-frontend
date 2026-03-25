// src/components/pure-designs/NetflixStyle.tsx
import React from 'react';

export const NetflixStyle: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Netflix Style View</h1>
      <p className="text-gray-400">This view is coming soon...</p>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Continue Watching</h2>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="w-full h-28 bg-red-600 rounded mb-2"></div>
              <p className="text-sm">Item {i}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

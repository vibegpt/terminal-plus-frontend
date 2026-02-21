// src/components/pure-designs/SpotifyStyle.tsx
import React from 'react';

export const SpotifyStyle: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Spotify Style View</h1>
      <p className="text-gray-400">This view is coming soon...</p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="w-full h-32 bg-green-600 rounded mb-2"></div>
          <p className="font-semibold">Playlist 1</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="w-full h-32 bg-green-600 rounded mb-2"></div>
          <p className="font-semibold">Playlist 2</p>
        </div>
      </div>
    </div>
  );
};

import React from "react";

export default function TerminalMapView() {
  // Temporary simplified version to avoid type conflicts
  return (
    <div className="mobile-container">
      {/* Mobile Header - Dark Blue Bar */}
      <div className="bg-[#0E1B33] text-white px-4 py-3 flex items-center justify-between">
        <button className="text-white text-sm font-medium">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🏠</span>
          <span className="font-semibold">Terminal Map</span>
        </div>
        <span className="text-sm text-gray-300">Step 4 of 4</span>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Terminal Map View
          </h1>
          <p className="text-gray-600">
            This component is temporarily simplified for compatibility
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <p className="text-gray-600 text-center">
            Terminal map functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
} 
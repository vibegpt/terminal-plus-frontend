import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GoogleMapsTerminal from '@/components/maps/GoogleMapsTerminal';
import PinClusterFilter from '@/components/maps/PinClusterFilter';
import TikTokPOICarousel from '@/components/maps/TikTokPOICarousel';

// Mock data function (you can replace this with your actual data source)
const getPOIsForTerminal = (terminal: string) => {
  return [
    {
      id: "1",
      name: "Starbucks",
      type: "Coffee",
      vibe: "Refuel",
      logo_url: "/images/default-amenity.jpg"
    },
    {
      id: "2",
      name: "Lounge Access",
      type: "Lounge",
      vibe: "Comfort",
      logo_url: "/images/default-amenity.jpg"
    },
    {
      id: "3",
      name: "Duty Free Shop",
      type: "Shopping",
      vibe: "Shop",
      logo_url: "/images/default-amenity.jpg"
    },
    {
      id: "4",
      name: "Work Station",
      type: "Services",
      vibe: "Work",
      logo_url: "/images/default-amenity.jpg"
    }
  ];
};

const VIBES = ["Refuel", "Comfort", "Quick", "Explore", "Work", "Shop", "Chill"];

const ExploreTerminal = () => {
  const navigate = useNavigate();
  const [selectedTerminal, setSelectedTerminal] = useState("T1");
  const [selectedVibe, setSelectedVibe] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<string[]>([]);

  const poiList = getPOIsForTerminal(selectedTerminal);

  const handlePOISelect = (poi: any) => {
    console.log("Selected POI:", poi);
    // Navigate to POI detail page or show modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Header */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 shadow-sm">
        <Button variant="ghost" onClick={() => navigate("/")}>
          ← Back to Home
        </Button>
        <h1 className="text-xl font-bold">Explore Terminal</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Terminal and Vibe Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Your Preferences</h2>
          
          {/* Terminal Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Terminal</label>
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="T1">Terminal 1</option>
              <option value="T2">Terminal 2</option>
              <option value="T3">Terminal 3</option>
            </select>
          </div>

          {/* Vibe Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Vibe (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(selectedVibe === vibe ? undefined : vibe)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedVibe === vibe
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pin Cluster Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6">
          <PinClusterFilter
            terminal={selectedTerminal}
            activeFilters={filters}
            onFilterChange={setFilters}
            journeyContext="transit"
            selectedVibe={selectedVibe}
          />
        </div>

        {/* Map and POI Carousel */}
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <GoogleMapsTerminal
            terminal={selectedTerminal}
            vibe={selectedVibe}
            filters={filters}
          />
          <TikTokPOICarousel
            poiList={poiList}
            onSelectPOI={handlePOISelect}
          />
        </div>
      </div>
    </div>
  );
};

export default ExploreTerminal;


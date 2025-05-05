import React, { useState, useEffect } from "react";
import MultiAirportTrip from "@/components/MultiAirportTrip";
import MultiAirportTimeline from "@/components/MultiAirportTimeline";
import { Loader2, Save, ListFilter, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

type TripStop = {
  Name: string;
  Type: string;
  LocationDescription: string;
};

type TripSegment = {
  airport: string;
  terminal: string;
  type: "Departure" | "Transit" | "Arrival/Final";
  vibe: "Relax" | "Explore" | "Work" | "Quick";
  plan: TripStop[];
};

const sampleTripData: TripSegment[] = [
  {
    airport: "SYD",
    terminal: "T1",
    type: "Departure",
    vibe: "Relax",
    plan: [
      { Name: "The Coffee Club", Type: "Cafe", LocationDescription: "Near Gate 10" },
      { Name: "Book & News", Type: "Retail", LocationDescription: "Near Gate 12" },
      { Name: "Relaxation Lounge", Type: "Lounge", LocationDescription: "2nd Floor" }
    ]
  },
  {
    airport: "SIN",
    terminal: "T3",
    type: "Transit",
    vibe: "Explore",
    plan: [
      { Name: "Butterfly Garden", Type: "Attraction", LocationDescription: "Terminal Center" },
      { Name: "Long Bar", Type: "Restaurant", LocationDescription: "Near Gate 20" },
      { Name: "Duty Free Shopping", Type: "Retail", LocationDescription: "Main Concourse" }
    ]
  },
  {
    airport: "LHR",
    terminal: "T5",
    type: "Arrival/Final",
    vibe: "Quick",
    plan: [
      { Name: "Pret A Manger", Type: "Cafe", LocationDescription: "Arrivals Hall" },
      { Name: "Currency Exchange", Type: "Service", LocationDescription: "Near Exit B" }
    ]
  }
];

function generateTripTitle(tripData: TripSegment[]): string {
  const airports = tripData.map(segment => segment.airport);
  return airports.length ? `${airports.join(" ➔ ")} (Trip)` : "New Trip";
}

export default function MultiAirportJourneyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tripData, setTripData] = useState<TripSegment[] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [tripId, setTripId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setTripData(sampleTripData);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (tripId) {
      const baseURL = window.location.origin;
      setShareLink(`${baseURL}/trip?id=${tripId}`);
    }
  }, [tripId]);

  const handleSaveTrip = async () => {
    if (!tripData || tripData.length === 0) {
      toast({
        title: "Cannot save empty trip",
        description: "There are no journey segments to save",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your trip",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    setIsSaving(true);

    try {
      const title = generateTripTitle(tripData);
      const response = await apiRequest("POST", "/api/saveTripBundle", {
        title,
        journeys: tripData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTripId(result.tripId);

        if (typeof gtag === "function") {
          gtag("event", "save_multi_airport_trip", {
            trip_id: result.tripId,
            total_stops: tripData.reduce((sum, seg) => sum + seg.plan.length, 0),
          });
        }

        toast({
          title: "Success!",
          description: "Your multi-airport trip has been saved",
          variant: "default",
        });
      } else {
        throw new Error(result.error || "Failed to save trip");
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error saving trip",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'timeline') => {
    setViewMode(mode);
    if (typeof gtag === "function") {
      gtag("event", "multi_airport_view_mode", {
        mode,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-lg">Loading your multi-airport journey plan...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => handleViewModeChange('grid')}
          className={`px-3 py-1 rounded-l-md flex items-center gap-1 ${
            viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Grid</span>
        </button>
        <button
          onClick={() => handleViewModeChange('timeline')}
          className={`px-3 py-1 rounded-r-md flex items-center gap-1 ${
            viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Timeline</span>
        </button>
      </div>

      {viewMode === 'grid' ? (
        <MultiAirportTrip tripData={tripData || []} />
      ) : (
        <MultiAirportTimeline tripData={tripData || []} />
      )}

      <div className="text-center mt-6 pb-8 space-y-4">
        <button
          onClick={handleSaveTrip}
          disabled={isSaving}
          className="bg-purple-600 text-white py-2 px-6 rounded hover:bg-purple-700 transition flex items-center justify-center mx-auto gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Full Trip Plan
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition text-sm flex items-center justify-center mx-auto gap-2"
        >
          🖨️ Print / Save as PDF
        </button>

        {shareLink && (
          <div className="text-center mt-6 space-y-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                if (typeof gtag === "function") {
                  gtag('event', 'copy_trip_share_link', {
                    method: 'button_click',
                    trip_id: tripId || 'unknown',
                  });
                }
                toast({
                  title: "Link copied!",
                  description: "The shareable trip link has been copied to your clipboard",
                  variant: "default",
                });
                window.history.pushState({}, '', shareLink);
              }}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition text-sm flex items-center justify-center mx-auto gap-2"
            >
              🔗 Copy Shareable Trip Link
            </button>
            <p className="text-sm text-gray-500 break-all max-w-md mx-auto">{shareLink}</p>
          </div>
        )}
      </div>
    </div>
  );
}
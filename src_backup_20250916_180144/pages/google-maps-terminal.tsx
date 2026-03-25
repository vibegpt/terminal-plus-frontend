import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GoogleMapsTerminal from "@/components/maps/GoogleMapsTerminal";
import { ArrowLeft, Home, MapPin, Globe } from "lucide-react";
import { useJourneyContext } from "@/context/JourneyContext";

// TEST: Import our Google Places photos service
import { placesPhotosService } from "@/services/googlePlacesPhotos";

export default function GoogleMapsTerminalPage() {
  const navigate = useNavigate();
  const { actions } = useJourneyContext();

  // TEST: Function to test Google Places photo loading
  const testPhotoLoading = async () => {
    console.log("🖼️ Testing Google Places photo loading...");
    try {
      const photos = await placesPhotosService.getAmenityPhotos("Ya Kun Kaya Toast", "SIN");
      console.log("🖼️ Photos found:", photos);
      if (photos.length > 0) {
        alert(`Photo found! Check console for URL: ${photos[0]}`);
      } else {
        alert("No photos found - but API call worked!");
      }
    } catch (error) {
      console.error("❌ Photo loading error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Set some mock data for testing if no journey data exists
  React.useEffect(() => {
    const mockJourneyData = {
      departure: "JFK",
      destination: "SIN",
      flightNumber: "SQ25",
      flightDate: "2024-01-15",
      layovers: [],
      selected_vibe: "Refuel",
      terminal: "SIN-T3"
    };
    
    // Only set if no journey data exists
    if (!localStorage.getItem("lastJourneyData")) {
      actions.setJourneyData(mockJourneyData);
      console.log("🔍 Set mock journey data for testing:", mockJourneyData);
    }
  }, [actions]);

  return (
    <div className="h-screen bg-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-800">Singapore Terminal 3 Map</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button variant="ghost" onClick={testPhotoLoading} className="hover:bg-slate-100 bg-yellow-50">
            🖼️ Test Photos
          </Button>
        </div>
      </div>

      {/* Google Maps View */}
      <div className="p-4">
        <GoogleMapsTerminal 
          terminal="T3"
          vibe=""
          filters={[]}
        />
      </div>
    </div>
  );
} 
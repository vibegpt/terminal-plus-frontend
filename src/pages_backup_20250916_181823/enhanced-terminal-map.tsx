import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EnhancedTerminalMapView from "@/components/EnhancedTerminalMapView";
import { ArrowLeft, Home, MapPin } from "lucide-react";

export default function EnhancedTerminalMapPage() {
  const navigate = useNavigate();

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
            <MapPin className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-800">Terminal Map</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      {/* Enhanced Map View */}
      <EnhancedTerminalMapView />
    </div>
  );
} 
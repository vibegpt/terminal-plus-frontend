import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TerminalMapView from "@/components/TerminalMapView";
import { ArrowLeft, Home } from "lucide-react";

export default function TerminalMapPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-slate-800">Terminal Map</h1>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      {/* Map View */}
      <TerminalMapView />
    </div>
  );
}
